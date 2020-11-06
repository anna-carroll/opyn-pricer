const utils = require('./utils');
const registry = require('./registry');
const moment = require("moment");

const TOKEN_SYMBOLS = {
    WETH: "WETH",
    ETH: "ETH",
    USDC: "USDC",
};

const TOKEN_ADDRESS_TO_SYMBOL = {
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": TOKEN_SYMBOLS.WETH,
    "0x0000000000000000000000000000000000000000": TOKEN_SYMBOLS.ETH,
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": TOKEN_SYMBOLS.USDC,
};

const TYPES = {
    CALL: "CALL",
    PUT: "PUT",
    INVALID: "INVALID",
};

//NOTE: functionality in this class could be replaced with a query to the Graph similar to the existing one on the frontend
class Opyn {
    static async getOptionsContracts() {
        //NOTE: not including the factory at registry.factory[0] because Haythem said that was old :~)
        const contractPromises = [];

        // get factory instance
        const factoryInstance = await utils.initContract(utils.OptionsFactoryAbi, registry.factory[1]);  // oEth factory

        // get number of oTokens
        const numTokens = await factoryInstance.methods.getNumberOfOptionsContracts().call();    // oEth

        for (let i = 0; i < numTokens; i++) {
            contractPromises.push(
                utils.initContract(
                    utils.OptionsContractAbi,
                    await factoryInstance.methods.optionsContracts(i).call()
                )
            );
        }

        return Promise.all(contractPromises);
    }

    static async getContractInfo(contract) {
        const address = contract._address; // oToken name
        const name = await contract.methods.name().call(); // oToken name
        const underlying = (await contract.methods.underlying().call()).toLowerCase();
        const strike = (await contract.methods.strike().call()).toLowerCase();

        //TODO: remove abominable hack for getting strike price
        const dollarIndex = name.indexOf("$");
        const spaceIndex = name.indexOf(" ", dollarIndex);
        const strikePrice = parseInt(name.slice(dollarIndex+1, spaceIndex));
        // const strikePriceRaw = await contract.methods.strikePrice().call();

        const optionExpiry = await contract.methods.expiry().call(); // oToken name

        let type;
        if (TOKEN_ADDRESS_TO_SYMBOL[underlying] === TOKEN_SYMBOLS.USDC) {
            type = TYPES.CALL;
        } else if (TOKEN_ADDRESS_TO_SYMBOL[strike] === TOKEN_SYMBOLS.USDC) {
            type = TYPES.PUT;
        } else {
            type = TYPES.INVALID;
        }

        return {
            name,
            address,
            underlying,
            underlyingSymbol: TOKEN_ADDRESS_TO_SYMBOL[underlying],
            strike,
            strikeSymbol: TOKEN_ADDRESS_TO_SYMBOL[strike],
            strikePrice,
            type,
            optionExpiry
        };
    }

    static async getAllOptions(onlyActive = true) {
        const contracts = await Opyn.getOptionsContracts();

        const allOptionPromises = contracts.map(contract => Opyn.getContractInfo(contract));

        let allOptions = await Promise.all(allOptionPromises);

        if (onlyActive) {
            const nowMoment = new moment();

            allOptions = allOptions.filter(contractInfo => {
                const expiryMoment = new moment.unix(contractInfo.optionExpiry);
                return expiryMoment.isAfter(nowMoment);
            });
        }

        return allOptions;
    }

    static async getEthOptions(onlyActive = true) {
        const allOptions = await Opyn.getAllOptions(onlyActive);

        return allOptions.filter(option => {
            const {underlyingSymbol, strikeSymbol} = option;
            return underlyingSymbol === TOKEN_SYMBOLS.WETH || strikeSymbol === TOKEN_SYMBOLS.ETH
        });
    }
}

exports.Opyn = Opyn;
exports.TYPES = TYPES;

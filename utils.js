// Import modules
const Web3 = require('web3');

// connect to Infura
const rpcUrl = process.env.WEB3_URL;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

// init contract object
exports.initContract = async (abi, address) => {
    return new web3.eth.Contract(abi, address);
};

// Import ABIs
exports.OptionsFactoryAbi = require('./ABI/OptionsFactory.json');
exports.OptionsContractAbi = require('./ABI/OptionsContract.json');

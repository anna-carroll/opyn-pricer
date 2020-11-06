const Pricer = require('./Pricer');

async function run() {
    const {bids, asks} = await Pricer.Pricer.getEthOptionPrices();

    console.log(`Bids: ${bids.length}`);
    console.log("\n\n");
    console.log(`Asks: ${asks.length}`);
}

run().then(() => {
    console.log("DONE");
});

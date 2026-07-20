require('@nomicfoundation/hardhat-toolbox'); // installé automatiquement avec hardhat

module.exports = {
  solidity: '0.8.20',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545'
      // chainId 31337 par défaut — pas besoin de le préciser
    }
  }
};
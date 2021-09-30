# Vanity name registering system

This is the task for composable finance by Ignasi Ramos.

Requirements:
Build a vanity name registering system resistant against frontrunning.
The purpose of the name is outside the scope of the assignment and you can make reasonable assumptions on the size, encoding, etc of the name to complete in time.
An unregistered name can be registered for a certain amount of time by locking a certain balance of an account. After the registration expires, the account loses ownership of the name and his balance is unlocked. The registration can be renewed by making an on-chain call to keep the name registered and balance locked.
You can assume reasonable defaults for the locking amount and period.
The fee to register the name depends directly on the size of the name. Also, a malicious node/validator should not be able to front-run the process by censoring transactions of an honest user and registering its name in its own account.

# Frontrunning explanation:<br>
To aviod frontrunning I have splitted the registration of the name in two steps. <br>
1- PreRegiter the name: The user has to call the function preRegister passing the name hashed with the name's owner address. Once the precommit is completed, the user has to wait 5 minutes to register the name<br>
2- Register: The user has to call the register function with the name in plain text. The function checks if there is a preregister for the following name and sender address and 5 minutes have passed from the PreRegiter. Finally, it registers the name. For a malicious node, it is impossible to delay the transaction to be commited to the blockchain by other nodes for 5 minutes since the user commits the name in plain text and it doesn't have enough time to make the preRegister before the other call is commited.

# Setup
```shell
npm i
```
Compile contracts
```shell
npx hardhat compile
```
Run tests
```shell
npx hardhat test
```
Other commands
```shell
npx hardhat accounts
npx hardhat clean
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
node scripts/deploy.js
npx eslint '**/*.js'
npx eslint '**/*.js' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```


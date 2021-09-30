const { expect } = require("chai");
const { ethers } = require("hardhat");
let vnrService;
let owner;
let alice;
let bob;

describe("VNRService", function () {
  const name = "vanity_name";

  it("Should deploy VNRService and check public variables", async function () {
    const VNRService = await ethers.getContractFactory("VNRService");
    vnrService = await VNRService.deploy();
    await vnrService.deployed();

    [owner, alice, bob] = await ethers.getSigners();

    expect(await vnrService.lockNamePrice()).to.equal("10000000000000000");
    expect(await vnrService.lockTime()).to.equal("31536000");
    expect(await vnrService.registeredBytePrice()).to.equal("100000000000000");
  });

  it("Should set new lock name price", async function () {
    await vnrService.setLockNamePrice("100000000000000000");
    expect(await vnrService.lockNamePrice()).to.equal("100000000000000000");
  });

  it("Alice Should check name is availabe", async function () {
    expect(
      await vnrService
        .connect(alice)
        .isNameAvailable(ethers.utils.toUtf8Bytes(name))
    ).to.equal(true);
  });

  it("Alice Should fail registering a short name", async function () {
    await expect(
      vnrService.connect(alice).isNameAvailable(ethers.utils.toUtf8Bytes("as"))
    ).to.be.revertedWith("Name is too short.");
  });

  it("Alice Should fail registering a long name", async function () {
    await expect(
      vnrService
        .connect(alice)
        .isNameAvailable(
          ethers.utils.toUtf8Bytes(
            "thisisaveryverylongnametofegisteritshouldfail"
          )
        )
    ).to.be.revertedWith("Name is too long.");
  });

  it("Alice Should preregister a name", async function () {
    const hashedName = await vnrService
      .connect(alice)
      .getPreRegisterHash(ethers.utils.toUtf8Bytes(name));
    await vnrService.connect(alice).preRegister(hashedName);
  });

  it("Alice should fail registering a name for cooldown", async function () {
    await expect(
      vnrService.connect(alice).register(ethers.utils.toUtf8Bytes(name))
    ).to.be.revertedWith("Register not unlocked yet. 5 minutes cooldown");
  });

  it("Alice should fail registering a name for insufficient amount", async function () {
    //Mine blocks to allow preRegister (add 5 minutes)
    await addEvmTime(400);
    await mineBlocks(1);
    await expect(
      vnrService.connect(alice).register(ethers.utils.toUtf8Bytes(name))
    ).to.be.revertedWith("Insufficient amount.");
  });

  it("Bob should fail trying to frontrun Alice", async function () {
    const hashedName = await vnrService
      .connect(bob)
      .getPreRegisterHash(ethers.utils.toUtf8Bytes(name));
    await vnrService.connect(bob).preRegister(hashedName);
    const priceName = await vnrService
      .connect(bob)
      .getRegisterPrice(ethers.utils.toUtf8Bytes(name));
    const overrides = { value: String(priceName) };
    await expect(
      vnrService
        .connect(bob)
        .register(ethers.utils.toUtf8Bytes(name), overrides)
    ).to.be.revertedWith("Register not unlocked yet. 5 minutes cooldown");
  });

  it("Alice should get price and register a name", async function () {
    const priceName = await vnrService
      .connect(alice)
      .getRegisterPrice(ethers.utils.toUtf8Bytes(name));
    const overrides = { value: String(priceName) };
    await vnrService
      .connect(alice)
      .register(ethers.utils.toUtf8Bytes(name), overrides);
  });

  it("Alice should check registered name not available anymore", async function () {
    await expect(
      vnrService.connect(alice).isNameAvailable(ethers.utils.toUtf8Bytes(name))
    ).to.be.revertedWith("Vanity name is not available.");
  });

  it("Should return Alice is owner", async function () {
    expect(
      await vnrService
        .connect(alice)
        .getNameOwner(ethers.utils.toUtf8Bytes(name))
    ).to.be.equal(alice.address);
  });

  it("Alice should be able to renew/extend expiry date", async function () {
    const priceName = await vnrService
      .connect(alice)
      .getNamePrice(ethers.utils.toUtf8Bytes(name));
    const overrides = { value: String(priceName) };
    await vnrService
      .connect(alice)
      .renew(ethers.utils.toUtf8Bytes(name), overrides);
  });

  it("Bob should not be able to withdraw Alice's balance", async function () {
    await expect(
      vnrService
        .connect(bob)
        .withdrawLockedBalance(ethers.utils.toUtf8Bytes(name))
    ).to.be.revertedWith("No balance to unlock");
  });

  it("Alice should not be able to unlock balance yet", async function () {
    await expect(
      vnrService
        .connect(alice)
        .withdrawLockedBalance(ethers.utils.toUtf8Bytes(name))
    ).to.be.revertedWith("Balance still locked");
  });

  it("Alice should be able to unlock balance", async function () {
    //Add 2 years to evm
    await addEvmTime(31656926 * 2);
    await mineBlocks(1);
    const balanceBefore = await getAccountBalance(alice.address);
    await vnrService
      .connect(alice)
      .withdrawLockedBalance(ethers.utils.toUtf8Bytes(name));
    const balanceAfter = await getAccountBalance(alice.address);
    expect(balanceAfter > balanceBefore).to.equal(true);
  });

  it("Alice should not be able to unlock balance again", async function () {
    await expect(
      vnrService
        .connect(alice)
        .withdrawLockedBalance(ethers.utils.toUtf8Bytes(name))
    ).to.be.revertedWith("No balance to unlock");
  });

  it("Should the registered name be available again", async function () {
    expect(
      await vnrService
        .connect(alice)
        .isNameAvailable(ethers.utils.toUtf8Bytes(name))
    ).to.equal(true);
  });

  it("Should the registered name have 0 address ownership", async function () {
    expect(
      await vnrService
        .connect(alice)
        .getNameOwner(ethers.utils.toUtf8Bytes(name))
    ).to.be.equal(ethers.constants.AddressZero);
  });

  it("Alice should be able to register name again", async function () {
    //Preregister
    const hashedName = await vnrService
      .connect(alice)
      .getPreRegisterHash(ethers.utils.toUtf8Bytes(name));
    await vnrService.connect(alice).preRegister(hashedName);
    //Mine blocks to allow preRegister (add 5 minutes)
    await addEvmTime(400);
    await mineBlocks(1);
    //Register
    const priceName = await vnrService
      .connect(alice)
      .getRegisterPrice(ethers.utils.toUtf8Bytes(name));
    const overrides = { value: String(priceName) };
    await vnrService
      .connect(alice)
      .register(ethers.utils.toUtf8Bytes(name), overrides);
    //Check availability
    await expect(
      vnrService.connect(alice).isNameAvailable(ethers.utils.toUtf8Bytes(name))
    ).to.be.revertedWith("Vanity name is not available.");
    expect(
      await vnrService
        .connect(alice)
        .getNameOwner(ethers.utils.toUtf8Bytes(name))
    ).to.be.equal(alice.address);
    //Mine blocks for a year
    await addEvmTime(31656926);
    await mineBlocks(1);
    expect(
      await vnrService
        .connect(alice)
        .isNameAvailable(ethers.utils.toUtf8Bytes(name))
    ).to.equal(true);
  });

  it("Alice should be able to unlock balance again", async function () {
    const balanceBefore = await getAccountBalance(alice.address);
    await vnrService
      .connect(alice)
      .withdrawLockedBalance(ethers.utils.toUtf8Bytes(name));
    const balanceAfter = await getAccountBalance(alice.address);
    expect(balanceAfter > balanceBefore).to.equal(true);
  });

  it("Bob should not be able to withdraw fees", async function () {
    await expect(vnrService.connect(bob).withdrawFees()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("Owner should be able to withdraw fees and have more balance", async function () {
    const balanceBefore = await getAccountBalance(owner.address);
    await vnrService.withdrawFees();
    const balanceAfter = await getAccountBalance(owner.address);
    expect(balanceAfter - balanceBefore > 0).to.equal(true);
  });

  it("Owner should not be able to withdraw twice", async function () {
    await expect(vnrService.withdrawFees()).to.be.revertedWith(
      "No fees to withdraw"
    );
  });

  it("Should contract balance to be 0", async function () {
    expect(await getAccountBalance(vnrService.address)).to.equal("0");
  });
});

async function getAccountBalance(address) {
  return await ethers.provider.getBalance(address);
}
async function addEvmTime(time) {
  await ethers.provider.send("evm_increaseTime", [time]);
}
async function mineBlocks(blockNumber) {
  while (blockNumber > 0) {
    blockNumber--;
    await ethers.provider.send("evm_mine");
  }
}

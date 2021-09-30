//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./vnrservice.sol";

contract VNRServiceHelper is VNRService {

	/*
	 * @dev - Get name hash used for unique identifier
	 * @param name
	 * @return nameHash
	 */
	function getPreRegisterHash(bytes memory _name)
		public
		view
		returns (bytes32)
	{
		// @dev - tightly pack parameters in struct for keccak256
		return keccak256(abi.encodePacked(msg.sender, _name));
	}
}

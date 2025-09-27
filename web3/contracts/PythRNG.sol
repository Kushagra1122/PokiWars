// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IPyth {
    function getRandom() external view returns (uint256);
}

contract GameRandomness {
    IPyth public pyth;

    constructor(address _pythAddress) {
        pyth = IPyth(_pythAddress);
    }

    // Returns a random number between l and r (inclusive)
    function randomNumberRange(uint256 l, uint256 r) public view returns (uint256) {
        require(r >= l, "Invalid range");
        uint256 rnd = pyth.getRandom();
        return (rnd % (r - l + 1)) + l;
    }
}

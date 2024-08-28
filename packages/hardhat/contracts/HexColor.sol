//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

library HexColor {
	function getGradientColor(
		string memory hexColor,
		int amt
	) internal pure returns (string memory) {
		int num = int(parseHexToUint(hexColor));
		uint r = check((num >> 16) + amt);
		uint b = check(((num >> 8) & 0x00ff) + amt);
		uint g = check((num & 0x0000ff) + amt);
		uint rgb = (g | (b << 8) | (r << 16));
		string memory result = Strings.toHexString(rgb, 3);
		return substring(result, 2, -1);
	}

	function parseHexToUint(
		string memory hexColor
	) internal pure returns (uint) {
		bytes memory hexBytes = bytes(hexColor);
		require(hexBytes.length == 6, "Invalid hex color string length");

		uint result = 0;
		for (uint256 i = 0; i < hexBytes.length; i++) {
			result *= 16;
			result += hexCharToUint(uint8(hexBytes[i]));
		}
		return result;
	}

	function hexCharToUint(uint8 b) internal pure returns (uint) {
		if (b >= 48 && b <= 57) {
			return b - 48; // '0' - '9'
		} else if (b >= 97 && b <= 102) {
			return b - 87; // 'a' - 'f', 'a' = 10
		} else if (b >= 65 && b <= 70) {
			return b - 55; // 'A' - 'F', 'A' = 10
		} else {
			revert("Invalid hex character");
		}
	}

	function check(int x) internal pure returns (uint) {
		if (x > 255) {
			return 255;
		} else if (x < 0) {
			return 0;
		}
		return uint(x);
	}

	function substring(
		string memory str,
		int startIndex,
		int endIndex
	) public pure returns (string memory) {
		bytes memory strBytes = bytes(str);
		uint start = 0;
		uint end = strBytes.length;
		if (startIndex >= 0) {
			start = uint(startIndex);
		}
		if (endIndex >= 0) {
			end = uint(endIndex);
		}
		require(start < end, "Invalid indices");
		require(end <= strBytes.length, "End index out of bounds");

		bytes memory result = new bytes(end - start);

		for (uint i = start; i < end; i++) {
			result[i - start] = strBytes[i];
		}

		return string(result);
	}
}

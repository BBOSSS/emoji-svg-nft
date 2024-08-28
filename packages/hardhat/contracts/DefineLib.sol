//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

library Defs {
	using Strings for uint256;

	struct HeadInfo {
		bytes color;
		uint8 shape;
	}

	struct EyesInfo {
		EyeInfo left;
		EyeInfo right;
	}

	struct EyeInfo {
		uint16 rx;
		uint16 ry;
		uint16 cx;
		uint16 cy;
	}

	struct MouthInfo {
		uint16 size;
		uint16 width;
		uint16 rotation;
	}

	function headDescription(
		HeadInfo memory head
	) internal pure returns (bytes memory desc) {
		desc = abi.encodePacked(
			"color=#",
			string(head.color),
			", shape=",
			uint256(head.shape).toString()
		);
	}

	function eyeDescription(
		EyeInfo memory eye
	) internal pure returns (bytes memory desc) {
		desc = abi.encodePacked(
			"[",
			uint256(eye.rx).toString(),
			", ",
			uint256(eye.ry).toString(),
			", ",
			uint256(eye.cx).toString(),
			", ",
			uint256(eye.cy).toString(),
			"]"
		);
	}

	function eyesDescription(
		EyesInfo memory eyes
	) internal pure returns (bytes memory desc) {
		desc = abi.encodePacked(
			"left=",
			string(eyeDescription(eyes.left)),
			", right=",
			string(eyeDescription(eyes.right))
		);
	}

	function mouthDescription(
		MouthInfo memory mouth
	) internal pure returns (bytes memory desc) {
		desc = abi.encodePacked(
			"size=",
			uint256(mouth.size).toString(),
			", width=",
			uint256(mouth.width).toString(),
			", rotation=",
			uint256(mouth.rotation).toString()
		);
	}
}

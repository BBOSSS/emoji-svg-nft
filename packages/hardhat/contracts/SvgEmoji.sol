//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";

import "./HexColor.sol";
import "./DefineLib.sol";

library SvgEmoji {
	using Strings for uint256;

	function tokenURI(
        uint256 id,
        address owner,
		Defs.HeadInfo memory head,
		Defs.EyesInfo memory eyes,
		Defs.MouthInfo memory mouth
	) public pure returns (string memory) {
        bytes memory name = abi.encodePacked("Emoji #", id.toString());
		bytes memory description = abi.encodePacked(
			"Emoji: ",
			string(Defs.headDescription(head)),
			", Eyes: ",
			string(Defs.eyesDescription(eyes)),
			", Mouth: ",
			string(Defs.mouthDescription(mouth))
		);
		string memory image = Base64.encode(
			renderSvgImage(head, eyes, mouth)
		);
		bytes memory json = abi.encodePacked(
			'{"name":"',
			string(name),
			'", "description":"',
			string(description),
			'", "external_url":"',
			'", "attributes": [{"trait_type": "emoji", "value": "',
			string(Defs.headDescription(head)),
			'"},{"trait_type": "eyes", "value": "',
			string(Defs.eyesDescription(eyes)),
			'"},{"trait_type": "mouth", "value": "',
			string(Defs.mouthDescription(mouth)),
			'"}], "owner":"',
			uint256(uint160(owner)).toHexString(20),
			'", "image": "',
			"data:image/svg+xml;base64,",
			image,
			'"}'
		);
		bytes memory base64 = abi.encodePacked(
			"data:application/json;base64,",
			Base64.encode(json)
		);
		return string(base64);
    }

	function tempTokenURI(
        uint256 id,
        address owner
	) public pure returns (string memory) {
		bytes memory name = abi.encodePacked("Emoji #", id.toString());
		bytes memory image = abi.encodePacked(
			'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 800 800">',
			'<text x="100" y="350" font-family="inherit" font-size="80">Emoji is minting...</text></svg>'
		);
		bytes memory json = abi.encodePacked(
			'{"name":"',
			string(name),
			'", "description":"", "external_url":"", "attributes": [], "owner":"',
			uint256(uint160(owner)).toHexString(20),
			'", "image": "data:image/svg+xml;base64,',
			Base64.encode(image),
			'"}'
		);
		bytes memory base64 = abi.encodePacked(
			"data:application/json;base64,",
			Base64.encode(json)
		);
		return string(base64);
	}

	function renderSvgImage(
		Defs.HeadInfo memory head,
		Defs.EyesInfo memory eyes,
		Defs.MouthInfo memory mouth
	) public pure returns (bytes memory image) {
		(bytes memory headDefs, bytes memory headData) = SvgHead.getEmojiHead(head);
		(bytes memory eyesDefs, bytes memory eyesData) = SvgEyes.getEmojiEyes(eyes);
		(bytes memory mouthDefs, bytes memory mouthData) = SvgMouth.getEmojiMouth(mouth);
		image = abi.encodePacked(
			'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 800 800"><defs>',
			string(headDefs),
			string(eyesDefs),
			string(mouthDefs),
			'</defs><g stroke-linecap="round">',
			string(headData),
			string(eyesData),
			string(mouthData),
			"</g></svg>"
		);
	}
}

library SvgHead {
	function getEmojiHead(
		Defs.HeadInfo memory headInfo
	) external pure returns (bytes memory defs, bytes memory data) {
		// HeadInfo memory headInfo = HeadInfo("ffe499", 0);	// debug
		string memory baseColor = string(headInfo.color);
		string memory stopColor1 = HexColor.getGradientColor(baseColor, -54);
		string memory stopColor2 = HexColor.getGradientColor(baseColor, 50);
		defs = abi.encodePacked(
			'<radialGradient id="svgemoji-grad-dark" r="93%" cx="20%" cy="20%"><stop offset="70%" stop-color="#',
			baseColor,
			'" stop-opacity="0"></stop><stop offset="97%" stop-color="#',
			stopColor1,
			'" stop-opacity="1"></stop></radialGradient><radialGradient id="svgemoji-grad-light" r="65%" cx="28%" cy="20%"><stop offset="0%" stop-color="#',
			stopColor2,
			'" stop-opacity="0.75"></stop><stop offset="100%" stop-color="#',
			baseColor,
			'" stop-opacity="0"></stop></radialGradient><filter id="svgemoji-blur" x="-100%" y="-100%" width="400%" height="400%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" ',
			'color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="30" x="0%" y="0%" width="100%" height="100%" ',
			'in="SourceGraphic" edgeMode="none" result="blur"></feGaussianBlur></filter><filter id="inner-blur" x="-100%" y="-100%" width="400%" height="400%" ',
			'filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">',
			'<feGaussianBlur stdDeviation="2" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" edgeMode="none" result="blur"></feGaussianBlur></filter>'
		);

		if (headInfo.shape == 0) {
			data = getCircleHeadData(headInfo);
		} else {
			data = getIrregularHeadData(headInfo);
		}
	}

	function getCircleHeadData(
		Defs.HeadInfo memory head
	) private pure returns (bytes memory data) {
		data = abi.encodePacked(
			'<circle r="250" cx="400" cy="400" fill="#',
			string(head.color),
			'" opacity="0.25" filter="url(#svgemoji-blur)" transform="translate(-10, 60)"></circle>',
			'<circle r="250" cx="400" cy="400" fill="#',
			string(head.color),
			'"></circle>',
			'<circle r="250" cx="400" cy="400" fill="url(#svgemoji-grad-dark)"></circle>',
			'<circle r="250" cx="400" cy="400" fill="url(#svgemoji-grad-light)"></circle>'
		);
	}

	function getIrregularHeadData(
		Defs.HeadInfo memory head
	) private pure returns (bytes memory data) {
		string[4] memory heads = [
			"M650 399.99999613096236C650 561.6737853047515 561.6737891737891 635.7549818859482 400 635.7549818859482C238.3269230769231 635.7549818859482 150 561.6737853047515 150 399.99999613096236C150 238.3269192078854 238.3269230769231 164.24501037597656 400 164.24501037597656C561.6737891737891 164.24501037597656 650 238.3269192078854 650 399.99999613096236Z ",
			"M650 399.9999886102486C650 561.6737777840377 561.6737891737891 664.2450028552628 400 664.2450028552628C238.3269230769231 664.2450028552628 150 561.6737777840377 150 399.9999886102486C150 238.32691168717167 238.3269230769231 135.75497436523438 400 135.75497436523438C561.6737891737891 135.75497436523438 650 238.32691168717167 650 399.9999886102486Z ",
			"M650 399.99998478233977C650 552.9582058065985 552.9582210242588 676.9541626799139 400 676.9541626799139C247.04245283018867 676.9541626799139 150 552.9582058065985 150 399.99998478233977C150 247.04243761252843 247.04245283018867 123.04580688476562 400 123.04580688476562C552.9582210242588 123.04580688476562 650 247.04243761252843 650 399.99998478233977Z ",
			"M650 399.99999613096236C650 561.6737853047515 561.6737891737891 635.7549818859482 400 635.7549818859482C238.3269230769231 635.7549818859482 150 561.6737853047515 150 399.99999613096236C150 238.3269192078854 238.3269230769231 164.24501037597656 400 164.24501037597656C561.6737891737891 164.24501037597656 650 238.3269192078854 650 399.99999613096236Z "
		];
		string memory headShape = heads[head.shape - 1];
		data = abi.encodePacked(
			'<path d="M650 449.99998478233977C650 602.9582058065985 552.9582210242588 726.9541626799139 400 726.9541626799139C247.04245283018867 726.9541626799139 150 602.9582058065985 150 449.99998478233977C150 297.04243761252843 247.04245283018867 173.04580688476562 400 173.04580688476562C552.9582210242588 173.04580688476562 650 297.04243761252843 650 449.99998478233977Z " fill="#',
			string(head.color),
			'" opacity="0.25" filter="url(#svgemoji-blur)"></path><path d="',
			string(headShape),
			'" fill="#',
			string(head.color),
			'"></path><path d="',
			string(headShape),
			'" fill="url(#svgemoji-grad-dark)"></path><path d="',
			string(headShape),
			'" fill="url(#svgemoji-grad-light)"></path>'
		);
	}
}

library SvgEyes {
	using Strings for uint256;

	function getEmojiEyes(
		Defs.EyesInfo memory eyes
	) external pure returns (bytes memory defs, bytes memory data) {
		defs = abi.encodePacked(
			'<filter id="eye-shadow" x="-100%" y="-100%" width="400%" height="400%" ',
			'filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" ',
			'color-interpolation-filters="sRGB">',
			'<feDropShadow stdDeviation="10" dx="10" dy="10" flood-color="#000000" flood-opacity="0.3" ',
			'x="0%" y="0%" width="100%" height="100%" result="dropShadow"></feDropShadow></filter>',
			'<linearGradient id="eye-light" gradientTransform="rotate(-25)" x1="50%" y1="0%" x2="50%" y2="100%">',
			'<stop offset="20%" stop-color="#323232" stop-opacity="1"></stop>',
			'<stop offset="100%" stop-color="#000000" stop-opacity="0"></stop></linearGradient>'
		);
		bytes memory leftTemp = abi.encodePacked(
			'rx="',
			uint256(eyes.left.rx).toString(),
			'" ry="',
			uint256(eyes.left.ry).toString(),
			'" cx="',
			uint256(eyes.left.cx).toString(),
			'" cy="',
			uint256(eyes.left.cy).toString()
		);
		bytes memory rightTemp = abi.encodePacked(
			'rx="',
			uint256(eyes.right.rx).toString(),
			'" ry="',
			uint256(eyes.right.ry).toString(),
			'" cx="',
			uint256(eyes.right.cx).toString(),
			'" cy="',
			uint256(eyes.right.cy).toString()
		);
		data = abi.encodePacked(
			"<g><ellipse ",
			string(leftTemp),
			'" fill="#000000" filter="url(#eye-shadow)"></ellipse><ellipse ',
			string(leftTemp),
			'" fill="url(#eye-light)" filter="url(#inner-blur)"></ellipse></g>',
			"<g><ellipse ",
			string(rightTemp),
			'" fill="#000000" filter="url(#eye-shadow)"></ellipse><ellipse ',
			string(rightTemp),
			'" fill="url(#eye-light)" filter="url(#inner-blur)"></ellipse></g>'
		);
	}
}

library SvgMouth {
	using Strings for uint256;

	function getEmojiMouth(
		Defs.MouthInfo memory mouth
	) external pure returns (bytes memory defs, bytes memory data) {
		defs = abi.encodePacked(
			'<linearGradient id="mouth-light" x1="50%" y1="0%" x2="50%" y2="100%">',
			'<stop offset="0%" stop-color="#ff9667" stop-opacity="1"></stop>',
			'<stop offset="100%" stop-color="#ff1205" stop-opacity="0"></stop></linearGradient>',
			'<filter id="mouth-shadow" x="-100%" y="-100%" width="400%" height="400%" ',
			'filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" ',
			'color-interpolation-filters="sRGB">',
			'<feDropShadow stdDeviation="10" dx="10" dy="10" x="0%" y="0%" width="100%" height="100%" ',
			'result="dropShadow" flood-color="#c20000" flood-opacity="0.9"></feDropShadow></filter>'
		);
		uint16 s = 350 - mouth.size;
		uint16 c = 400 - mouth.size;
		uint16 e = 450 + mouth.size;
		bytes memory temp = abi.encodePacked(
			'<path d="M',
			uint256(s).toString(),
			" 512.5Q",
			uint256(c).toString(),
			" 562.5 ",
			uint256(e).toString(),
			' 512.5" transform="rotate(',
			uint256(mouth.rotation).toString(),
			', 400, 400)"'
		);

		data = abi.encodePacked(
			string(temp),
			' stroke-width="',
			uint256(mouth.width).toString(),
			'" stroke="#ff1205"',
			' fill="none" filter="url(#mouth-shadow)"></path>',
			string(temp),
			' stroke-width="6" stroke="url(#mouth-light)" fill="none"'
			' filter="url(#inner-blur)"></path>'
		);
	}
}

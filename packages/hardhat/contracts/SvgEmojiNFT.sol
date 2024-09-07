//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

import "./DefineLib.sol";
import "./SvgEmoji.sol";

//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract SvgEmojiNFT is
	Initializable,
	UUPSUpgradeable,
	ERC721EnumerableUpgradeable,
	OwnableUpgradeable,
	VRFConsumerBaseV2
{
	using Strings for uint256;

    event NftRequested(address indexed minter, uint256 indexed requestId);
    event NftMinted(address indexed minter, uint256 indexed tokenId, uint256 indexed requestId);
	event Withdraw(address indexed addr, uint256 amount);

	uint256 private _tokenIds;
	uint256 public constant limit = 3728;
	uint256 public constant curve = 1002; // price increase 0.2% with each purchase
	uint256 public price;

	mapping(uint256 => Defs.HeadInfo) private headMap;
	mapping(uint256 => Defs.EyesInfo) private eyesMap;
	mapping(uint256 => Defs.MouthInfo) private mouthMap;

	mapping(uint256 => bool) private tokenIdMinted;

    // Chainlink VRF Variables
	bool public useVRF;
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    bytes32 private immutable gasLane;
    uint64 private immutable subscriptionId;
    uint32 private immutable callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 2;
    mapping(uint256 => uint256) public requestIdToTokenId;

	constructor(
		address _vrfCoordinatorV2,
        uint64 _subscriptionId,
        uint32 _callbackGasLimit,
        bytes32 _gasLane	// keyHash
	) VRFConsumerBaseV2(_vrfCoordinatorV2) {
		vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
		subscriptionId = _subscriptionId;
		callbackGasLimit = _callbackGasLimit;
		gasLane = _gasLane;
		_disableInitializers();
	}

	function _authorizeUpgrade(
		address _newImplementation
	) internal override onlyOwner {}

	function initialize() public initializer {
		__ERC721_init("DynamicSvgEmojis", "EMOJI");
		__ERC721Enumerable_init();
		__Ownable_init(msg.sender);
		__UUPSUpgradeable_init();
		price = 0.001 ether;
		useVRF = false;
	}

	function setUseVRF(bool _useVRF) public onlyOwner {
		useVRF = _useVRF;
	}

	function mintItem() public payable returns (uint256) {
		require(_tokenIds < limit, "DONE MINTING");
		require(msg.value >= price, "NOT ENOUGH");

		price = (price * curve) / 1000;
		_tokenIds++;

		if (!useVRF) {
			return mintWithoutVRF();
		}

		uint256 requestId = vrfCoordinator.requestRandomWords(
	        gasLane,
	        subscriptionId,
	        REQUEST_CONFIRMATIONS,
	        callbackGasLimit,
	        NUM_WORDS
	    );
		requestIdToTokenId[requestId] = _tokenIds;
		_safeMint(msg.sender, _tokenIds);
		emit NftRequested(msg.sender, requestId);
		return _tokenIds;
	}

	function mintWithoutVRF() private returns (uint256) {
		uint256 id = _tokenIds;
		bytes32 prevHash1 = blockhash(block.number - 1);
		bytes32 hash1 = keccak256(abi.encodePacked(prevHash1, address(this)));
		bytes32 prevHash2 = blockhash(block.number - 2);
		bytes32 hash2 = keccak256(abi.encodePacked(prevHash2, address(this)));
		uint256[] memory randomWords = new uint[](2);
		randomWords[0] = uint256(hash1);
		randomWords[1] = uint256(hash2);
		randomHead(id, randomWords);
		randomEyes(id, randomWords);
		randomMouth(id, randomWords);
		_safeMint(msg.sender, _tokenIds);
		tokenIdMinted[id] = true;
		return _tokenIds;
	}

	function fulfillRandomWords(
		uint256 requestId,
		uint256[] memory randomWords
	) internal override {
		require(randomWords.length >= NUM_WORDS, "Not enough random numbers");
		uint256 id = requestIdToTokenId[requestId];
		randomHead(id, randomWords);
		randomEyes(id, randomWords);
		randomMouth(id, randomWords);
		tokenIdMinted[id] = true;
		emit NftMinted(_ownerOf(id), id, requestId);
	}

	function tokenURI(uint256 id) public view override returns (string memory) {
		require(_ownerOf(id) != address(0), "not exist");
		address owner = ownerOf(id);
		if (!tokenIdMinted[id]) {
			return SvgEmoji.tempTokenURI(id, owner);
		}
		return SvgEmoji.tokenURI(id, owner, headMap[id], eyesMap[id], mouthMap[id]);
	}

	function withdraw() public onlyOwner {
		uint256 amount = address(this).balance;
		(bool success, ) = payable(msg.sender).call{ value: amount }("");
		require(success, "Withdraw failed");
		emit Withdraw(msg.sender, amount);
	}

	function randomHead(uint256 id, uint256[] memory randomWords) internal {
		string[21] memory colors = [
			"ffe499", "eadc9a", "f4b58b", "ffca57", "fcd303", "cc6600", "bad728",
			"82d4b6", "688abb", "288ed7", "576bcb", "f03346", "4c4d4d", "b517a7",
			"e21d6f", "ffb3cb", "b4ffad", "75ffdf", "99d5ff", "c69eff", "ff5770"
		];
		uint256 index = randomWords[0] % 21;
		uint256 headShape = randomWords[1] % 5;
		headMap[id] = Defs.HeadInfo(bytes(colors[index]), uint8(headShape));
	}

	function randomEyes(uint256 id, uint256[] memory randomWords) internal {
		uint16 r = uint16(randomWords[0] % 60 + 20);
		uint16 c = uint16(randomWords[1] % 140 + 200);
		eyesMap[id] = Defs.EyesInfo({
			left: Defs.EyeInfo(r, r, 300, 330),
			right: Defs.EyeInfo(r, r, 500, 330)
		});
		if (c % 2 == 0) {
			eyesMap[id].left.cx = c;
			eyesMap[id].left.cy = c + 50;
		} else {
			eyesMap[id].right.cx = c + 260;
			eyesMap[id].right.cy = c + 50;
		}
	}

	function randomMouth(uint256 id, uint256[] memory randomWords) internal {
		uint16 size = uint16(randomWords[0] % 50);
		uint16 width = uint16((randomWords[1] % 20) + 10);
		uint16 rotation = uint16(
			(randomWords[0] % 40) + (randomWords[1] % 40)
		);
		if (rotation > 40) {
			rotation = 400 - rotation;
		}
		mouthMap[id] = Defs.MouthInfo(size, width, rotation);
	}
}

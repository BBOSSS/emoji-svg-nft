//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract SwapNFT is 
	Initializable,
	UUPSUpgradeable,
	OwnableUpgradeable,
	IERC721Receiver {
	// Errors define
	error SwapNFT__NotApproved(uint256 tokenId);
	error SwapNFT__PriceInvalid(uint256 price);
	error SwapNFT__NotTokenOwner(uint256 tokenId);
	error SwapNFT__TokenNotList(uint256 tokenId);
	error SwapNFT__InsufficientEth(uint256 amount, uint256 price);
	error SwapNFT__TransferEthFailed(uint256 amount, address to);
	error SwapNFT__OutOfBoundsIndex(address owner, uint256 index);

	// Events define
	event List(address indexed seller, uint256 indexed tokenId, uint256 price);
	event Purchase(
		address indexed buyer,
		uint256 indexed tokenId,
		uint256 price
	);
	event Revoke(address indexed seller, uint256 indexed tokenId);
	event Update(
		address indexed seller,
		uint256 indexed tokenId,
		uint256 newPrice
	);

	// Structs define
	struct Order {
		address owner;
		uint256 price;
	}

	// Storage variables define
	IERC721 public immutable nft;
	mapping(uint256 => Order) public orderMap;

	mapping(address owner => mapping(uint256 index => uint256)) public _ownedTokens;
	mapping(uint256 tokenId => uint256) public _ownedTokensIndex;
    mapping(address owner => uint256) ownerBalance;

	// uint256[] public _allTokens;
	// mapping(uint256 tokenId => uint256) public _allTokensIndex;

	constructor(address nftAddress) {
		_disableInitializers();
		nft = IERC721(nftAddress);
	}

	function _authorizeUpgrade(
		address _newImplementation
	) internal override onlyOwner {}

	function initialize() public initializer {
		__Ownable_init(msg.sender);
		__UUPSUpgradeable_init();
	}

	function list(uint256 _tokenId, uint256 _price) public {
		if (nft.getApproved(_tokenId) != address(this)) {
			revert SwapNFT__NotApproved(_tokenId);
		}
		if (_price <= 0) {
			revert SwapNFT__PriceInvalid(_price);
		}
		//设置NFT持有人和价格
		Order storage _order = orderMap[_tokenId];
		_order.owner = msg.sender;
		_order.price = _price;
		// 将NFT转账到合约
		nft.safeTransferFrom(msg.sender, address(this), _tokenId);
        ownerBalance[msg.sender]++;
		// 添加到Enumeration
		_addTokenToOwnerEnumeration(msg.sender, _tokenId);
		// 释放List事件
		emit List(msg.sender, _tokenId, _price);
	}

	function revoke(uint256 _tokenId) public {
		// NFT在当前合约中挂单
		if (nft.ownerOf(_tokenId) != address(this)) {
			revert SwapNFT__TokenNotList(_tokenId);
		}
		Order storage _order = orderMap[_tokenId];
		// 必须由持有人发起
		if (_order.owner != msg.sender) {
			revert SwapNFT__NotTokenOwner(_tokenId);
		}
		// 将NFT转给卖家
		nft.safeTransferFrom(address(this), msg.sender, _tokenId);
        ownerBalance[msg.sender]--;
		// 删除order
		delete orderMap[_tokenId];
		// 从Enumeration中移除
		_removeTokenFromOwnerEnumeration(msg.sender, _tokenId);
		// 释放Revoke事件
		emit Revoke(msg.sender, _tokenId);
	}

	function update(uint256 _tokenId, uint256 _newPrice) public {
		// NFT价格大于0
		if (_newPrice <= 0) {
			revert SwapNFT__PriceInvalid(_newPrice);
		}
		// NFT在当前合约中挂单
		if (nft.ownerOf(_tokenId) != address(this)) {
			revert SwapNFT__TokenNotList(_tokenId);
		}
		Order storage _order = orderMap[_tokenId];
		// 必须由持有人发起
		if (_order.owner != msg.sender) {
			revert SwapNFT__NotTokenOwner(_tokenId);
		}
		// 调整NFT价格
		_order.price = _newPrice;
		// 释放Update事件
		emit Update(msg.sender, _tokenId, _newPrice);
	}

	function purchase(uint256 _tokenId) public payable {
		// NFT在当前合约中挂单
		if (nft.ownerOf(_tokenId) != address(this)) {
			revert SwapNFT__TokenNotList(_tokenId);
		}
		Order storage _order = orderMap[_tokenId];
		// NFT价格大于0
		if (_order.price <= 0) {
			revert SwapNFT__PriceInvalid(_order.price);
		}
		// 购买价格大于标价
		if (msg.value < _order.price) {
			revert SwapNFT__InsufficientEth(msg.value, _order.price);
		}
		// 将NFT转给买家
		nft.safeTransferFrom(address(this), msg.sender, _tokenId);
        ownerBalance[_order.owner]--;
		// 将ETH转给卖家，多余ETH给买家退款
		uint256 price = _order.price;
		(bool success1, ) = payable(_order.owner).call{ value: price }("");
		if (!success1) {
			revert SwapNFT__TransferEthFailed(price, _order.owner);
		}
		uint256 back = msg.value - price;
		(bool success2, ) = payable(msg.sender).call{ value: back }("");
		if (!success2) {
			revert SwapNFT__TransferEthFailed(back, msg.sender);
		}
		// 删除order
		delete orderMap[_tokenId];
		// 从Enumeration中移除
		_removeTokenFromOwnerEnumeration(msg.sender, _tokenId);
		// 释放Purchase事件
		emit Purchase(msg.sender, _tokenId, _order.price);
	}

	function onERC721Received(
		address /* operator */,
		address /* from */,
		uint /* tokenId */,
		bytes calldata /* data */
	) external pure override returns (bytes4) {
		return IERC721Receiver.onERC721Received.selector;
	}

	function tokenOfOwnerByIndex(
		address owner,
		uint256 index
	) public view virtual returns (uint256) {
		if (index >= ownerBalance[owner]) {
			revert SwapNFT__OutOfBoundsIndex(owner, index);
		}
		return _ownedTokens[owner][index];
	}

	/**
	 * @dev Private function to add a token to this extension's ownership-tracking data structures.
	 * @param to address representing the new owner of the given token ID
	 * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
	 */
	function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
		uint256 lastTokenIndex = ownerBalance[to] - 1;
		_ownedTokens[to][lastTokenIndex] = tokenId;
		_ownedTokensIndex[tokenId] = lastTokenIndex;
	}

	/**
	 * @dev Private function to remove a token from this extension's ownership-tracking data structures. Note that
	 * while the token is not assigned a new owner, the `_ownedTokensIndex` mapping is _not_ updated: this allows for
	 * gas optimizations e.g. when performing a transfer operation (avoiding double writes).
	 * This has O(1) time complexity, but alters the order of the _ownedTokens array.
	 * @param from address representing the previous owner of the given token ID
	 * @param tokenId uint256 ID of the token to be removed from the tokens list of the given address
	 */
	function _removeTokenFromOwnerEnumeration(
		address from,
		uint256 tokenId
	) private {
		// To prevent a gap in from's tokens array, we store the last token in the index of the token to delete, and
		// then delete the last slot (swap and pop).

		uint256 lastTokenIndex = ownerBalance[from];
		uint256 tokenIndex = _ownedTokensIndex[tokenId];

		// When the token to delete is the last token, the swap operation is unnecessary
		if (tokenIndex != lastTokenIndex) {
			uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

			_ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
			_ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
		}

		// This also deletes the contents at the last position of the array
		delete _ownedTokensIndex[tokenId];
		delete _ownedTokens[from][lastTokenIndex];
	}

	function balanceOf(address owner) public view returns (uint256) {
		return ownerBalance[owner];
	}
}

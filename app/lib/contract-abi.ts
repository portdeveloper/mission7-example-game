// Contract ABI for the game smart contract
// Replace this with the actual ABI from the Monad Explorer
export const GAME_CONTRACT_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  { inputs: [], name: "AccessControlBadConfirmation", type: "error" },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bytes32", name: "neededRole", type: "bytes32" },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "game", type: "address" },
      { indexed: false, internalType: "string", name: "name", type: "string" },
      { indexed: false, internalType: "string", name: "image", type: "string" },
      { indexed: false, internalType: "string", name: "url", type: "string" },
    ],
    name: "GameRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "game", type: "address" },
    ],
    name: "GameUnregistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "game", type: "address" },
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "scoreAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "transactionAmount",
        type: "uint256",
      },
    ],
    name: "PlayerDataUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "GAME_ROLE",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "games",
    outputs: [
      { internalType: "address", name: "game", type: "address" },
      { internalType: "string", name: "image", type: "string" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "url", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
    name: "getRoleAdmin",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "playerDataPerGame",
    outputs: [
      { internalType: "uint256", name: "score", type: "uint256" },
      { internalType: "uint256", name: "transactions", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_game", type: "address" },
      { internalType: "string", name: "_name", type: "string" },
      { internalType: "string", name: "_image", type: "string" },
      { internalType: "string", name: "_url", type: "string" },
    ],
    name: "registerGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "callerConfirmation", type: "address" },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "totalScoreOfPlayer",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "totalTransactionsOfPlayer",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "game", type: "address" }],
    name: "unregisterGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "player", type: "address" },
      { internalType: "uint256", name: "scoreAmount", type: "uint256" },
      { internalType: "uint256", name: "transactionAmount", type: "uint256" },
    ],
    name: "updatePlayerData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

import { io } from "socket.io-client";
import { SOCKET_URL } from "../utils/constants";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
});

export default socket;

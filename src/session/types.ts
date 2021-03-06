import Multiaddr = require("multiaddr");

import { NodeId, ENR } from "../enr";
import { Packet, AuthTag } from "../packet";
import { Message, RequestMessage } from "../message";

export enum SessionState {
  /**
   * A WHOAREYOU packet has been sent, and the Session is awaiting an Authentication response.
   */
  WhoAreYouSent,
  /**
   * A RANDOM packet has been sent and the Session is awaiting a WHOAREYOU response.
   */
  RandomSent,
  /**
   * An AuthMessage has been sent with a new set of generated keys. Once a response has been
   * received that we can decrypt, the session transitions to an established state, replacing
   * any current set of keys. No Session is currently active.
   */
  AwaitingResponse,
  /**
   * An established Session has received a WHOAREYOU. In this state, messages are sent
   * out with the established sessions keys and new encrypted messages are first attempted to
   * be decrypted with the established session keys, upon failure, the new keys are tried. If
   * the new keys are successful, the session keys are updated and the state progresses to
   * `Established`
   */
  EstablishedAwaitingResponse,
  /**
   * A Session has been established and the ENR IP matches the source IP.
   */
  Established,
  /**
   * Processing has failed. Fatal error.
   */
  Poisoned,
}

export interface IKeys {
  authRespKey: Buffer;
  encryptionKey: Buffer;
  decryptionKey: Buffer;
}

/**
 * Wrapper interface for Session state
 * We maintain 0, 1, or 2 keys depending on the state
 */
export type ISessionState =
  {state: SessionState.WhoAreYouSent} |
  {state: SessionState.RandomSent} |
  {state: SessionState.Poisoned} |
  {state: SessionState.AwaitingResponse; currentKeys: IKeys} |
  {state: SessionState.Established; currentKeys: IKeys} |
  {state: SessionState.EstablishedAwaitingResponse; currentKeys: IKeys; newKeys: IKeys};

export enum TrustedState {
  /**
   * The ENR socket address matches what is observed
   */
  Trusted,
  /**
   * The source socket address of the last message doesn't match the known ENR.
   * In this state, the service will respond to requests, but does not treat the node as
   * connected until the IP is updated to match the source IP.
   */
  Untrusted,
}

/**
 * A request to a node that we are waiting for a response
 */
export interface IPendingRequest {
  /**
   * The destination NodeId
   */
  dstId: NodeId;
  /**
   * The destination Multiaddr
   */
  dst: Multiaddr;
  /**
   * The raw packet sent
   */
  packet: Packet;
  /**
   * The unencrypted message. Required if we need to re-encrypt and re-send
   */
  message?: RequestMessage;
  /**
   * The number if times this request has been re-sent
   */
  retries: number;
}

export interface ISessionEvents {
  /**
   * A session has been established with a node
   */
  established: (enr: ENR) => void;
  /**
   * A message was received
   */
  message: (srcId: NodeId, src: Multiaddr, message: Message) => void;
  /**
   * A WHOAREYOU packet needs to be sent.
   * This requests the protocol layer to send back the highest known ENR.
   */
  whoAreYouRequest: (srcId: NodeId, src: Multiaddr, authTag: AuthTag) => void;
  /**
   * An RPC request failed.
   */
  requestFailed: (srcId: NodeId, rpcId: bigint) => void;
}

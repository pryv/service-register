// flow-typed signature: a2d4d07297263342bb4bd28815ce81e1
// flow-typed version: da30fe6876/bcrypt_v0.8.x/flow_>=v0.25.x

declare module bcrypt {
  declare function genSaltSync(rounds?: number): string;
  declare function genSalt(
    rounds: number,
    callback: (err: Error, salt: string) => void
  ): void;
  declare function genSalt(callback: (err: Error, salt: string) => void): void;
  declare function hashSync(data: string, salt: string): string;
  declare function hashSync(data: string, rounds: number): string;
  declare function hash(
    data: string,
    salt: string,
    callback: (err: Error, encrypted: string) => void
  ): void;
  declare function hash(
    data: string,
    rounds: number,
    callback: (err: Error, encrypted: string) => void
  ): void;
  declare function compareSync(data: string, encrypted: string): boolean;
  declare function compare(
    data: string,
    encrypted: string,
    callback: (err: Error, same: boolean) => void
  ): void;
  declare function getRounds(encrypted: string): number;
}

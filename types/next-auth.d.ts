export {};

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
  interface User {}
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}

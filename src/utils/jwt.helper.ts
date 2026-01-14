import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret: string = process.env.JWT_SECRET || "fallback-secret-key";

const expirationTime: string = process.env.EXPIRATION_TOKEN || "7d";

interface Info {
  id: string;
  email: string;
}

//  function to sign

const signToken = async (info: Info) => {
  return jwt.sign(
    info,
    secret as string,
    {
      expiresIn: expirationTime as string,
    } as jwt.SignOptions
  );
};

// function to verify

const verify = async (token: string) => {
  return jwt.verify(token, secret as string) as Info;
};

export { signToken, verify };

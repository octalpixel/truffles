import crypto from "crypto";

const algorithmMap = {
  HS256: "sha256",
  HS384: "sha384",
  HS512: "sha512",
  RS256: "RSA-SHA256",
};

type Algorithm = keyof typeof algorithmMap;

const typeMap = {
  HS256: "hmac",
  HS384: "hmac",
  HS512: "hmac",
  RS256: "sign",
};

export const decode = (
  token: string,
  key: string,
  noVerify?: boolean,
  algorithm?: Algorithm
) => {
  // check token
  if (!token) {
    throw new Error("No token supplied");
  }
  // check segments
  const segments = token.split(".");
  if (segments.length !== 3) {
    throw new Error("Not enough or too many segments");
  }

  // All segment should be base64
  const [headerSeg, payloadSeg, signatureSeg] = segments;

  // base64 decode and parse JSON
  const header: { alg: Algorithm } = JSON.parse(base64urlDecode(headerSeg));
  const payload = JSON.parse(base64urlDecode(payloadSeg));

  if (!noVerify) {
    if (!algorithm && /BEGIN( RSA)? PUBLIC KEY/.test(key.toString())) {
      algorithm = "RS256";
    }

    const signingMethod = algorithmMap[algorithm || header.alg];
    const signingType = typeMap[algorithm || header.alg];
    if (!signingMethod || !signingType) {
      throw new Error("Algorithm not supported");
    }

    // verify signature. `sign` will return base64 string.
    const signingInput = [headerSeg, payloadSeg].join(".");
    if (!verify(signingInput, key, signingMethod, signingType, signatureSeg)) {
      throw new Error("Signature verification failed");
    }

    // Support for nbf and exp claims.
    // According to the RFC, they should be in seconds.
    if (payload.nbf && Date.now() < payload.nbf * 1000) {
      throw new Error("Token not yet active");
    }

    if (payload.exp && Date.now() > payload.exp * 1000) {
      throw new Error("Token expired");
    }
  }

  return payload;
};

export const encode = (
  payload: any,
  key: string,
  algorithm?: Algorithm,
  options?: { header: any }
) => {
  // Check key
  if (!key) {
    throw new Error("Require key");
  }

  // Check algorithm, default is HS256
  if (!algorithm) {
    algorithm = "HS256";
  }

  const signingMethod = algorithmMap[algorithm];
  const signingType = typeMap[algorithm];
  if (!signingMethod || !signingType) {
    throw new Error("Algorithm not supported");
  }

  // header, typ is fixed value.
  const header = { typ: "JWT", alg: algorithm };
  if (options && options.header) {
    assignProperties(header, options.header);
  }

  // create segments, all segments should be base64 string
  const segments = [];
  segments.push(base64urlEncode(JSON.stringify(header)));
  segments.push(base64urlEncode(JSON.stringify(payload)));
  segments.push(sign(segments.join("."), key, signingMethod, signingType));

  return segments.join(".");
};

const assignProperties = (
  dest: Record<string, any>,
  source: Record<string, any>
) => {
  for (const attr in source) {
    if (source.hasOwnProperty(attr)) {
      dest[attr] = source[attr];
    }
  }
};

const verify = (
  input: string,
  key: string,
  method: string,
  type: string,
  signature: string
) => {
  if (type === "hmac") {
    return signature === sign(input, key, method, type);
  } else if (type == "sign") {
    return crypto
      .createVerify(method)
      .update(input)
      .verify(key, base64urlUnescape(signature), "base64");
  } else {
    throw new Error("Algorithm type not recognized");
  }
};

const sign = (input: string, key: string, method: string, type: string) => {
  let base64str;
  if (type === "hmac") {
    base64str = crypto.createHmac(method, key).update(input).digest("base64");
  } else if (type == "sign") {
    base64str = crypto.createSign(method).update(input).sign(key, "base64");
  } else {
    throw new Error("Algorithm type not recognized");
  }

  return base64urlEscape(base64str);
};

const base64urlDecode = (str: string) => {
  return Buffer.from(base64urlUnescape(str), "base64").toString();
};

const base64urlUnescape = (str: string) => {
  str += new Array(5 - (str.length % 4)).join("=");
  return str.replace(/\-/g, "+").replace(/_/g, "/");
};

const base64urlEncode = (str: string) => {
  return base64urlEscape(Buffer.from(str).toString("base64"));
};

const base64urlEscape = (str: string) => {
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

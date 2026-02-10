package com.webhook.platform.domain.security;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class HmacUtils {

  // HMAC-SHA256 is the industry standard for webhook signatures (e.g., Stripe, GitHub).
  // It ensures payload integrity and authenticity without exposing the secret key.
  private static final String ALGORITHM = "HmacSHA256";

  public static String sign(String data, String secret) {
    try {
      Mac sha256_HMAC = Mac.getInstance(ALGORITHM);
      SecretKeySpec secret_key =
          new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), ALGORITHM);
      sha256_HMAC.init(secret_key);

      byte[] rawHmac = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
      return Base64.getEncoder().encodeToString(rawHmac);
    } catch (NoSuchAlgorithmException | InvalidKeyException e) {
      throw new RuntimeException("Error calculating HMAC signature", e);
    }
  }
}

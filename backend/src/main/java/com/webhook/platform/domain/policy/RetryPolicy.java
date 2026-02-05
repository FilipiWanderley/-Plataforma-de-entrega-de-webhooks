package com.webhook.platform.domain.policy;

import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;

@Component
public class RetryPolicy {

    private static final long BASE_DELAY_SECONDS = 1;
    private static final long MAX_DELAY_SECONDS = 86400; // 24 hours cap
    private static final double JITTER_FACTOR = 0.2; // 20% jitter

    public boolean canRetry(Integer httpStatus, Throwable error) {
        if (error != null) {
            // Network errors, timeouts, etc. are usually retryable
            return true;
        }

        if (httpStatus == null) {
            return true; // Should not happen if error is null, but safe default
        }

        // 429 Too Many Requests -> Retry
        if (httpStatus == 429) {
            return true;
        }

        // 5xx Server Errors -> Retry
        if (httpStatus >= 500) {
            return true;
        }

        // 404 Not Found / 410 Gone -> Fail immediately
        if (httpStatus == 404 || httpStatus == 410) {
            return false;
        }

        // Other 4xx -> Default to no retry (Client Error)
        if (httpStatus >= 400 && httpStatus < 500) {
            return false;
        }

        // Default case (should be covered above, but for safety)
        return false;
    }

    public long calculateDelaySeconds(int attempt) {
        // Exponential Backoff: 2^attempt
        double delay = BASE_DELAY_SECONDS * Math.pow(2, attempt);

        // Apply Cap
        if (delay > MAX_DELAY_SECONDS) {
            delay = MAX_DELAY_SECONDS;
        }

        // Apply Jitter: Randomize between delay * (1 - JITTER) and delay * (1 + JITTER)
        // Or simple additive jitter: delay + random(0, delay * JITTER)
        // Using multiplicative jitter for better spread
        double jitterRange = delay * JITTER_FACTOR;
        double jitter = ThreadLocalRandom.current().nextDouble(-jitterRange, jitterRange);
        
        long finalDelay = (long) (delay + jitter);
        
        return Math.max(1, finalDelay); // Ensure at least 1 second
    }

    public String determineErrorType(Integer httpStatus, Throwable error) {
        if (error != null) {
            if (error instanceof java.net.SocketTimeoutException || error instanceof java.util.concurrent.TimeoutException) {
                return "TIMEOUT";
            }
            if (error instanceof java.io.IOException) {
                return "NETWORK_ERROR";
            }
            return error.getClass().getSimpleName();
        }

        if (httpStatus != null) {
            if (httpStatus == 429) return "RATE_LIMIT_EXCEEDED";
            if (httpStatus == 404) return "NOT_FOUND";
            if (httpStatus == 410) return "GONE";
            if (httpStatus >= 500) return "SERVER_ERROR_" + httpStatus;
            if (httpStatus >= 400) return "CLIENT_ERROR_" + httpStatus;
        }

        return "UNKNOWN_ERROR";
    }
}

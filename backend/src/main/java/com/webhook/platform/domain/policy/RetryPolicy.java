package com.webhook.platform.domain.policy;

import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;

@Component
public class RetryPolicy {

    private static final long BASE_DELAY_SECONDS = 1;
    private static final long MAX_DELAY_SECONDS = 86400; // 24 hours cap
    private static final double JITTER_FACTOR = 0.2; // 20% jitter

    public boolean canRetry(Integer httpStatus, Throwable error) {
        // Network errors are inherently transient.
        if (error != null) {
            return true;
        }

        if (httpStatus == null) {
            return true;
        }

        // Retry on Rate Limits (429) and Server Errors (5xx).
        if (httpStatus == 429 || httpStatus >= 500) {
            return true;
        }

        // Fail fast on Client Errors (4xx) except 429.
        return false;
    }

    public long calculateDelaySeconds(int attempt) {
        // Exponential Backoff with Jitter to prevent Thundering Herd.
        double delay = BASE_DELAY_SECONDS * Math.pow(2, attempt);

        if (delay > MAX_DELAY_SECONDS) {
            delay = MAX_DELAY_SECONDS;
        }

        // Multiplicative jitter provides better spread than additive.
        double jitterRange = delay * JITTER_FACTOR;
        double jitter = ThreadLocalRandom.current().nextDouble(-jitterRange, jitterRange);
        
        return Math.max(1, (long) (delay + jitter));
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

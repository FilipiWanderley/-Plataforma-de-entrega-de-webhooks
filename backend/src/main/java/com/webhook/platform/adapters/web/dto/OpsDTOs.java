package com.webhook.platform.adapters.web.dto;

public class OpsDTOs {
    public record DashboardMetrics(
        long totalPending,
        long totalSuccess,
        long totalFailed,
        long totalDlq,
        long totalProcessing
    ) {}
}

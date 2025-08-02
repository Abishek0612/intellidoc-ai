interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isEnabled = process.env.NODE_ENV === "development";

  startMeasure(componentName: string): string {
    if (!this.isEnabled) return "";
    const measureName = `${componentName}-${Date.now()}`;
    performance.mark(`${measureName}-start`);
    return measureName;
  }

  endMeasure(measureName: string, componentName: string): void {
    if (!this.isEnabled || !measureName) return;

    performance.mark(`${measureName}-end`);
    performance.measure(
      measureName,
      `${measureName}-start`,
      `${measureName}-end`
    );

    const measure = performance.getEntriesByName(measureName)[0];
    if (measure) {
      this.metrics.push({
        componentName,
        renderTime: measure.duration,
        timestamp: Date.now(),
      });

      if (measure.duration > 16) {
        console.warn(
          `Slow render detected: ${componentName} took ${measure.duration.toFixed(
            2
          )}ms`
        );
      }
    }

    performance.clearMarks(`${measureName}-start`);
    performance.clearMarks(`${measureName}-end`);
    performance.clearMeasures(measureName);
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

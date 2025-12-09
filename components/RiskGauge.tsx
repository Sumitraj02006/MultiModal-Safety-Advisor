import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface RiskGaugeProps {
  score: number; // 0 to 100
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const width = 200;
    const height = 120; // Half circle
    const radius = Math.min(width, height * 2) / 2;
    const innerRadius = radius - 20;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height})`);

    // Define color scale
    const colorScale = d3.scaleLinear<string>()
      .domain([0, 50, 100])
      .range(["#ef4444", "#eab308", "#22c55e"]); // Red -> Yellow -> Green

    // Background Arc
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    g.append("path")
      .attr("d", arc as any)
      .attr("fill", "#e2e8f0");

    // Foreground Arc (Animated)
    const scoreAngle = -Math.PI / 2 + (score / 100) * Math.PI;
    
    const activeArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(scoreAngle);

    g.append("path")
      .attr("d", activeArc as any)
      .attr("fill", colorScale(score));

    // Text Label
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .attr("class", "text-3xl font-bold fill-slate-700")
      .text(`${score}`);
      
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-2.5em")
      .attr("class", "text-xs font-medium uppercase fill-slate-500 tracking-wider")
      .text("Safety Score");

  }, [score]);

  return <svg ref={svgRef} />;
};

export default RiskGauge;
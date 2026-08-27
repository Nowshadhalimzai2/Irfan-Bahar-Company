import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { getDariCategory } from "../location-translator"

interface ProductionCategory {
    id: number;
    name: string;
    total: number;
}

interface HighProductionChartProps {
    productionChart: Record<string, string | number>[];
    topProductionCategories: ProductionCategory[];
}

const HighProductionChart = ({ productionChart, topProductionCategories }: HighProductionChartProps) => {
    const chartConfig = topProductionCategories.reduce<ChartConfig>((config, category, index) => {
        config[`category_${category.id}`] = {
            label: `${getDariCategory(category.name)} (Total: ${category.total})`,
            color: index === 0 ? "#2563eb" : "#f59e0b",
        }

        return config
    }, {})

    return (
        <div className="p-1 mt-2 border ">
            <h5 className="text-center text-accent font-medium pb-1 pt-2">ګراف تولیدات</h5>
            <p className="text-muted-foreground text-sm text-center pb-2">ګراف برای تولیدات که در اخر هفته زیاتر تولید شده</p>
            <div className="max-w-full overflow-auto">
                <fieldset>
                    <ChartContainer config={chartConfig} className="min-h-60 w-full">
                        <BarChart accessibilityLayer data={productionChart}>
                            <CartesianGrid />
                            <XAxis
                                dataKey={"day"}
                                tickLine={false}
                                tickMargin={5}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(5)}
                            />
                          
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            {topProductionCategories.map((category, index) => (
                                <Bar
                                    key={category.id}
                                    dataKey={`category_${category.id}`}
                                    fill={index === 0 ? "#2563eb" : "#f59e0b"}
                                    radius={4}
                                />
                            ))}
                        </BarChart>
                    </ChartContainer>
                </fieldset>
            </div>
        </div>
    )
}
export default HighProductionChart;
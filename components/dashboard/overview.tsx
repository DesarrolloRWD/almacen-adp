"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"

const data = [
  {
    name: "Ene",
    entradas: 580,
    salidas: 400,
  },
  {
    name: "Feb",
    entradas: 690,
    salidas: 518,
  },
  {
    name: "Mar",
    entradas: 1100,
    salidas: 980,
  },
  {
    name: "Abr",
    entradas: 1200,
    salidas: 1120,
  },
  {
    name: "May",
    entradas: 900,
    salidas: 880,
  },
  {
    name: "Jun",
    entradas: 1700,
    salidas: 1580,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: "#E5E7EB" }}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            borderColor: "#E5E7EB",
            borderRadius: "6px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        />
        <Legend />
        <Bar dataKey="entradas" name="Entradas" fill="#1050c0" radius={[4, 4, 0, 0]} />
        <Bar dataKey="salidas" name="Salidas" fill="#4080ff" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

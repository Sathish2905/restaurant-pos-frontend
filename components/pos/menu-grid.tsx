"use client"

import { useState } from "react"
import Image from "next/image"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type MenuItem, type Category } from "@/lib/types"
import { useSettings } from "@/lib/settings-context"

interface MenuGridProps {
  items: MenuItem[]
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  onAddToCart: (item: MenuItem & { quantity: number }) => void
}

export function MenuGrid({ items, categories, selectedCategory, onCategoryChange, onAddToCart }: MenuGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { getSetting } = useSettings()
  const showImages = getSetting("pos_image_preview") !== "false"

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="p-6 space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === "All" ? "default" : "outline"}
          onClick={() => onCategoryChange("All")}
          size="sm"
        >
          All Items
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.name ? "default" : "outline"}
            onClick={() => onCategoryChange(category.name)}
            size="sm"
          >
            <span className="mr-1.5">{category.icon}</span>
            {category.name}
          </Button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "cursor-pointer hover:shadow-lg transition-shadow",
              !item.available && "opacity-60 cursor-not-allowed grayscale-[0.5]"
            )}
            onClick={() => item.available && onAddToCart({ ...item, quantity: 1 })}
          >
            <CardContent className="p-0">
              {showImages ? (
                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  {/* Semi-transparent image background */}
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    className="object-cover opacity-50"
                  />

                  {/* Overlay content */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    {/* Top section - Out of stock badge */}
                    <div className="flex justify-end">
                      {!item.available && (
                        <Badge variant="destructive" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </div>

                    {/* Bottom section - Item details */}
                    <div className="space-y-1 bg-black/40 backdrop-blur-sm p-3 -mx-4 -mb-4 mt-auto">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-xs sm:text-sm leading-tight line-clamp-2 text-white shadow-sm">
                          {item.name}
                        </h3>
                        <Badge variant="default" className="shrink-0 font-bold bg-primary text-primary-foreground text-[10px] h-5">
                          ${item.price.toFixed(2)}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-[10px] text-gray-100 line-clamp-1 font-medium italic opacity-90">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">{item.name}</h3>
                      {!item.available && (
                        <Badge variant="destructive" className="w-fit text-[10px] h-4 px-1">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      ${item.price.toFixed(2)}
                    </Badge>
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No items found</p>
        </div>
      )}
    </div>
  )
}

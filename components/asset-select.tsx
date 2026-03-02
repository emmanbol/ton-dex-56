"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { AssetInfo } from "@/hooks/use-assets-query";
import { useStonApi } from "@/hooks/use-ston-api";
import { Formatter } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { TonAddressRegex } from "@/constants";

type AssetSelectProps = {
  assets?: AssetInfo[];
  selectedAsset: AssetInfo | null;
  onAssetSelect?: (asset: AssetInfo | null) => void;
  className?: string;
  loading?: boolean;
};

export function AssetSelect({
  assets = [],
  selectedAsset,
  onAssetSelect,
  loading,
  className,
}: AssetSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const stonApi = useStonApi();

  // Detect if the search input is a raw TON contract address
  const isAddress = TonAddressRegex.test(search.trim());

  // When an address is pasted, fetch that specific asset using unconditionalAssets
  const { data: addressResult, isFetching: addressFetching } = useQuery({
    queryKey: ["asset-by-address", search.trim()],
    enabled: isAddress,
    queryFn: async () => {
      const results = await stonApi.queryAssets({
        unconditionalAssets: [search.trim()],
      });
      // Filter strictly to only the address we asked for — API may return extras
      return results.find(
        (a) => a.contractAddress.toLowerCase() === search.trim().toLowerCase()
      ) ?? null;
    },
  });

  const handleAssetSelect = (assetAddress: string) => {
    // First check address lookup result, then fall back to the loaded list
    const asset =
      (isAddress && addressResult?.contractAddress === assetAddress
        ? addressResult
        : null) ??
      assets.find((a) => a.contractAddress === assetAddress);

    if (asset && onAssetSelect) {
      onAssetSelect(asset);
    }

    setSearch("");
    setOpen(false);
  };

  // Filter the local list by symbol or address substring
  const handleFilter = (_: string, value: string, keywords: string[] = []) => {
    if (!search) return 1;
    const q = search.toLowerCase();
    const [symbol = ""] = keywords;
    return symbol.toLowerCase().includes(q) || value.toLowerCase().includes(q)
      ? 1
      : 0;
  };

  // What to show in the list
  const showAddressResult = isAddress && addressResult;
  const showAddressLoading = isAddress && addressFetching;
  const showAddressNotFound = isAddress && !addressFetching && !addressResult;

  if (loading) {
    return <Skeleton className={cn("w-full h-10", className)} />;
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className={cn("w-full px-2!", className)}
        >
          {selectedAsset ? (
            <>
              <Avatar className="size-[20px]">
                <AvatarImage
                  src={selectedAsset.meta?.imageUrl}
                  alt={selectedAsset.meta?.displayName ?? selectedAsset.meta?.symbol}
                />
              </Avatar>
              {selectedAsset.meta?.symbol}
            </>
          ) : (
            "Select asset..."
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" avoidCollisions={false}>
        <Command filter={handleFilter} shouldFilter={!isAddress}>
          <CommandInput
            placeholder="Search name or paste address..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {/* Address paste flow */}
            {showAddressLoading && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Skeleton className="h-6 w-6 rounded-full" />
                Looking up address...
              </div>
            )}
            {showAddressNotFound && (
              <CommandEmpty>No token found for this address.</CommandEmpty>
            )}
            {showAddressResult && (
              <CommandGroup heading="Address result">
                <CommandItem
                  className="flex gap-2"
                  key={addressResult.contractAddress}
                  value={addressResult.contractAddress}
                  keywords={[addressResult.meta?.symbol ?? ""]}
                  onSelect={handleAssetSelect}
                >
                  <Avatar className="w-6 h-6 aspect-square">
                    <AvatarImage
                      src={addressResult.meta?.imageUrl}
                      alt={addressResult.meta?.symbol}
                    />
                    <AvatarFallback>
                      <Skeleton className="rounded-full" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{addressResult.meta?.symbol}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {addressResult.meta?.displayName}
                  </span>
                </CommandItem>
              </CommandGroup>
            )}

            {/* Normal symbol search flow */}
            {!isAddress && (
              <>
                <CommandEmpty>No asset found.</CommandEmpty>
                <CommandGroup>
                  {assets.map((asset) => (
                    <CommandItem
                      className="flex gap-2"
                      key={asset.contractAddress}
                      value={asset.contractAddress}
                      keywords={[asset.meta?.symbol ?? ""]}
                      onSelect={handleAssetSelect}
                    >
                      <Avatar className="w-6 h-6 aspect-square">
                        <AvatarImage
                          src={asset.meta?.imageUrl}
                          alt={asset.meta?.displayName ?? asset.meta?.symbol}
                        />
                        <AvatarFallback>
                          <Skeleton className="rounded-full" />
                        </AvatarFallback>
                      </Avatar>
                      {asset.meta?.symbol}
                      {asset.balance ? (
                        <pre className="ml-auto">
                          {Formatter.units(asset.balance, asset.meta?.decimals ?? 9)}
                        </pre>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
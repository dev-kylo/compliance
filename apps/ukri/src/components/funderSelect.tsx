'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { funderOptions } from '@/lib/data';

export function FunderSelect() {
  return (
    <Select defaultValue="ukri_epsrc">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select funder" />
      </SelectTrigger>
      <SelectContent>
        {funderOptions.map((funder) => (
          <SelectItem
            key={funder.id}
            value={funder.id}
            disabled={!funder.enabled}
          >
            {funder.name}
            {!funder.enabled && ' (Coming soon)'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

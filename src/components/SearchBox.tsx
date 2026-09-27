import Form from "next/form";
import { SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { MAX_QUERY_LENGTH } from "@/lib/jev";

export function SearchBox({
  defaultValue,
  autoFocus,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  return (
    <Form action="/search" className="w-full">
      <InputGroup className="h-12 rounded-full bg-card">
        <InputGroupAddon className="pl-4">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          name="q"
          type="search"
          required
          maxLength={MAX_QUERY_LENGTH}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          autoComplete="off"
          aria-label="Ask Needle a question"
          placeholder="Ask a question…"
          className="text-base"
        />
        <InputGroupAddon align="inline-end" className="pr-1.5">
          <InputGroupButton type="submit" variant="default" size="sm" className="rounded-full px-4">
            Ask
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Form>
  );
}

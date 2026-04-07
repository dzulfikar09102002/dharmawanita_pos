import { router } from "@inertiajs/react"
import {
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import type { Pagination } from "@/lib/model"
import { Button } from "./ui/button"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList
} from "./ui/combobox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "./ui/select"

type Props<T> = {
    pagination: Pagination<T>
}

export default function TablePagination<T>({ pagination }: Props<T>) {
    const { per_page, total, prev_page_url, next_page_url, current_page, last_page, first_page_url } = pagination

    // Fungsi untuk handle perpindahan halaman via Select
    const handlePageChange = (page: string | null) => {
        if (page) {
            router.get(first_page_url, { page: page }, { preserveScroll: true })
        }
    }

    return (
        <div className="lg:flex justify-between mt-4">

            <div className="text-sm flex items-center gap-2 mb-2">
                <span>Menampilkan</span>
                <Select
                    value={String(per_page)}
                    onValueChange={(val) => router.get(first_page_url, { per_page: val }, { preserveScroll: true })}
                >
                    <SelectTrigger className="h-9 w-20">
                        <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                </Select>
                <span>dari <b>{total}</b> baris data</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
                <div>Halaman</div>
                <div>
                    <Button
                        size={"icon"}
                        variant="outline"
                        disabled={!prev_page_url}
                        onClick={() => prev_page_url && router.get(prev_page_url, {}, { preserveScroll: true })}
                    >
                        <ChevronLeft />
                    </Button>
                </div>

                {/* --- Select Page Baru Disisipkan di Sini --- */}
                <Combobox
                    items={Array.from({ length: last_page }, (_, i) => (i + 1).toString())}
                    defaultValue={String(current_page)}
                    onValueChange={(handlePageChange)}
                >
                    <ComboboxInput placeholder="Pilih Halaman" />
                    <ComboboxContent>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                            {page => (
                                <ComboboxItem key={page} value={String(page)}>
                                    {page}
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
                {/* ------------------------------------------ */}

                <div>
                    <Button
                        size={"icon"}
                        variant="outline"
                        disabled={!next_page_url}
                        onClick={() => next_page_url && router.get(next_page_url, {}, { preserveScroll: true })}
                    >
                        <ChevronRight />
                    </Button>
                </div>
            </div>
        </div>
    )
}
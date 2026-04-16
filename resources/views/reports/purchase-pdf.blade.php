<!DOCTYPE html>
<html>
@php
$namaBulan = [
    1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
    4 => 'April',   5 => 'Mei',      6 => 'Juni',
    7 => 'Juli',    8 => 'Agustus',  9 => 'September',
    10 => 'Oktober',11 => 'November',12 => 'Desember'
];

$now = \Carbon\Carbon::now();

// 🔥 FIX ERROR bulan (biar ga Illegal offset)
$bulanInt = (int) ($bulan ?? $now->month);

// 🔥 TOTAL PENGELUARAN REAL (exclude canceled)
$totalPengeluaran = $transactions
    ->where('status_payment', '!=', 'canceled')
    ->sum(function ($trx) {
        return $trx->paid_amount ?? ($trx->quantity * $trx->purchase_price);
    });
@endphp

<head>
<meta charset="utf-8">
 <title>{{ $title }}</title>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: DejaVu Sans, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    padding: 30px 36px;
}

.header {
    text-align: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #1a1a1a;
}

.header h1 {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 6px;
}

.header p {
    font-size: 10px;
    color: #555;
}

table {
    width: 100%;
    border-collapse: collapse;
}

thead tr {
    background-color: #1a1a1a;
    color: #fff;
}

th, td {
    padding: 6px 8px;
    font-size: 10px;
}

tbody tr:nth-child(even) {
    background-color: #f8f8f8;
}

tfoot tr {
    background-color: #f0f0f0;
    border-top: 2px solid #1a1a1a;
}

.text-right { text-align: right; }
.text-center { text-align: center; }

.badge {
    padding: 2px 7px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: bold;
}

.paid { background: #dcfce7; color: #14532d; }
.pending { background: #fef9c3; color: #713f12; }
.canceled { background: #fee2e2; color: #7f1d1d; }

.no-data {
    text-align: center;
    padding: 16px;
    color: #888;
    font-style: italic;
}
</style>
</head>

<body>

<div class="header">
    <h1>LAPORAN PEMBELIAN</h1>
    <p>
        @if ($type === 'month')
            Periode: {{ $namaBulan[$bulanInt] ?? '-' }} {{ $tahun }}
        @else
            Periode: Tahun {{ $tahun }}
        @endif
    </p>
    <p>
        Dicetak pada:
        {{ $now->format('d') }} {{ $namaBulan[$now->month] }} {{ $now->format('Y') }}
    </p>
</div>

<table>
<thead>
<tr>
    <th>No</th>
    <th>Kode</th>
    <th>Produk</th>
    <th>Supplier</th>
    <th>Tanggal</th>
    <th class="text-center">Status</th>
    <th class="text-right">Qty</th>
    <th class="text-right">Harga</th>
    <th class="text-right">Total</th>
    <th class="text-right">Pengeluaran</th> {{-- ✅ kolom baru --}}
</tr>
</thead>

<tbody>
@forelse ($transactions as $i => $trx)
    @php
        $date = \Carbon\Carbon::parse($trx->purchase_date);
        $status = $trx->status_payment ?? 'pending';
        $subtotal = $trx->quantity * $trx->purchase_price;

        // 🔥 LOGIC PENGELUARAN
        if ($status === 'canceled') {
            $pengeluaran = 0;
        } else {
            $pengeluaran = $trx->paid_amount ?? $subtotal;
        }
    @endphp

<tr>
    <td class="text-center">{{ $i + 1 }}</td>
    <td>{{ $trx->code }}</td>
    <td>{{ $trx->product->name ?? '-' }}</td>
    <td>{{ $trx->supplier->name ?? '-' }}</td>

    <td>
        {{ $date->format('d') }}
        {{ $namaBulan[$date->month] }}
        {{ $date->format('Y') }}
    </td>

    <td class="text-center">
        <span class="badge {{ $status }}">
            {{ ucfirst($status) }}
        </span>
    </td>

    <td class="text-right">{{ $trx->quantity }}</td>

    <td class="text-right">
        Rp {{ number_format($trx->purchase_price, 0, ',', '.') }}
    </td>

    <td class="text-right">
        Rp {{ number_format($subtotal, 0, ',', '.') }}
    </td>

    <td class="text-right">
        @if ($status === 'canceled')
            -
        @else
            Rp {{ number_format($pengeluaran, 0, ',', '.') }}
        @endif
    </td>
</tr>

@empty
<tr>
    <td colspan="10" class="no-data">
        Tidak ada data pembelian
    </td>
</tr>
@endforelse
</tbody>

<tfoot>
<tr>
    <td colspan="9"><strong>Total Pengeluaran</strong></td>
    <td class="text-right">
        <strong>
            Rp {{ number_format($totalPengeluaran, 0, ',', '.') }}
        </strong>
    </td>
</tr>
</tfoot>

</table>

</body>
</html>
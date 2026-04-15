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
$isDeleted = request('deleted') == 1;
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
    <h1>
        {{ $isDeleted ? 'LAPORAN BARANG RUSAK / EXPIRED' : 'LAPORAN PENJUALAN' }}
    </h1>

    <p>
        @if ($type === 'month')
            Periode: {{ $namaBulan[(int) $bulan] ?? '-' }} {{ $tahun }}
        @else
            Periode: {{ $tahun }}
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
            <th style="width:5%">No</th>

            @if ($isDeleted)
                <th style="width:25%">Nama Barang</th>
                <th style="width:10%" class="text-center">Jumlah</th>
                <th style="width:20%">Tanggal</th>
                <th style="width:20%">Alasan</th>
                <th style="width:20%" class="text-right">Kerugian</th>
            @else
                <th style="width:30%">Invoice</th>
                <th style="width:12%" class="text-center">Status</th>
                <th style="width:20%">Tanggal</th>
                <th style="width:33%" class="text-right">Total</th>
            @endif
        </tr>
    </thead>

    <tbody>
        @forelse ($transactions as $i => $trx)
            @php
                $date = \Carbon\Carbon::parse($trx->transaction_date);
            @endphp

            <tr>
                <td class="text-center">{{ $i + 1 }}</td>

                @if ($isDeleted)
    <td>
        {{
            $trx->details
                ->map(fn($d) => ($d->purchase->product->name ?? '-') . ' (' . $d->quantity . ')')
                ->join(', ')
            ?: '-'
        }}
    </td>

    <td class="text-center">
        {{ $trx->details->sum('quantity') ?: '-' }}
    </td>

    <td>
        {{ $date->format('d') }}
        {{ $namaBulan[(int) $date->format('n')] ?? '-' }}
        {{ $date->format('Y') }}
    </td>

    <td>
        {{ $trx->reason ?? '-' }}
    </td>

    <td class="text-right">
        Rp {{ number_format($trx->total_amount ?? 0, 0, ',', '.') }}
    </td>

@else
    <td>{{ $trx->invoice_number }}</td>

    <td class="text-center">
        <span class="badge {{ $trx->payment_status }}">
            {{ ucfirst($trx->payment_status) }}
        </span>
    </td>

    <td>
        {{ $date->format('d') }}
        {{ $namaBulan[(int) $date->format('n')] ?? '-' }}
        {{ $date->format('Y') }}
    </td>

    <td class="text-right">
        Rp {{ number_format($trx->grand_total ?? 0, 0, ',', '.') }}
    </td>
@endif
            </tr>

        @empty
            <tr>
                <td colspan="{{ $isDeleted ? 6 : 5 }}" class="no-data">
                    Tidak ada data
                </td>
            </tr>
        @endforelse
    </tbody>

    <tfoot>
        <tr>
            <td colspan="{{ $isDeleted ? 5 : 4 }}">
                <strong>
                    {{ $isDeleted ? 'Total Kerugian' : 'Grand Total' }}
                </strong>
            </td>

            <td class="text-right">
                <strong>
                    Rp {{ number_format($total, 0, ',', '.') }}
                </strong>
            </td>
        </tr>
    </tfoot>
</table>

</body>
</html>
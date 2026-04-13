<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Pembelian</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #1a1a1a;
            background: #fff;
            padding: 30px 36px;
        }

        /* ── HEADER ── */
        .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #1a1a1a;
        }

        .header h1 {
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }

        .header p {
            font-size: 10px;
            color: #555;
            margin: 2px 0;
        }

        /* ── TABLE ── */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0;
        }

        thead tr {
            background-color: #1a1a1a;
            color: #fff;
        }

        thead th {
            padding: 7px 8px;
            text-align: left;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 0.3px;
        }

        tbody tr {
            border-bottom: 1px solid #e5e5e5;
        }

        tbody tr:nth-child(even) {
            background-color: #f8f8f8;
        }

        tbody td {
            padding: 6px 8px;
            font-size: 10px;
            color: #1a1a1a;
            vertical-align: middle;
        }

        tfoot tr {
            background-color: #f0f0f0;
            border-top: 2px solid #1a1a1a;
        }

        tfoot td {
            padding: 7px 8px;
            font-size: 11px;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        /* ── BADGE ── */
        .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            letter-spacing: 0.2px;
        }

        .paid     { background: #dcfce7; color: #14532d; }
        .pending  { background: #fef9c3; color: #713f12; }
        .canceled { background: #fee2e2; color: #7f1d1d; }

        /* ── NO DATA ── */
        .no-data {
            text-align: center;
            padding: 16px;
            color: #888;
            font-style: italic;
        }
    </style>
</head>
<body>

@php
    $namaBulan = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
        4 => 'April',   5 => 'Mei',      6 => 'Juni',
        7 => 'Juli',    8 => 'Agustus',  9 => 'September',
        10 => 'Oktober',11 => 'November',12 => 'Desember'
    ];
    $now = \Carbon\Carbon::now();
@endphp

<div class="header">
    <h1>LAPORAN PEMBELIAN</h1>
    <p>
        @if ($type === 'month')
            Periode: {{ $namaBulan[$bulan] }} {{ $tahun }}
        @else
            Periode: Tahun {{ $tahun }}
        @endif
    </p>
    <p>Dicetak pada: {{ $now->format('d') }} {{ $namaBulan[$now->month] }} {{ $now->format('Y') }}</p>
</div>

<table>
    <thead>
        <tr>
            <th style="width:4%">No</th>
            <th style="width:10%">Kode</th>
            <th style="width:18%">Produk</th>
            <th style="width:15%">Supplier</th>
            <th style="width:12%">Tanggal Transaksi</th>
            <th style="width:9%" class="text-center">Status</th>
            <th style="width:6%" class="text-right">Qty</th>
            <th style="width:13%" class="text-right">Harga Beli</th>
            <th style="width:13%" class="text-right">Total</th>
        </tr>
    </thead>

    <tbody>
        @forelse ($transactions as $i => $trx)
            @php
                $date     = \Carbon\Carbon::parse($trx->purchase_date);
                $status   = $trx->status_payment ?? 'pending';
                $subtotal = $trx->quantity * $trx->purchase_price;
            @endphp
            <tr>
                <td class="text-center">{{ $i + 1 }}</td>
                <td>{{ $trx->code }}</td>
                <td>{{ $trx->product->name ?? '-' }}</td>
                <td>{{ $trx->supplier->name ?? '-' }}</td>
                <td>{{ $date->format('d') }} {{ $namaBulan[$date->month] }} {{ $date->format('Y') }}</td>
                <td class="text-center">
                    <span class="badge {{ $status }}">{{ ucfirst($status) }}</span>
                </td>
                <td class="text-right">{{ $trx->quantity }}</td>
                <td class="text-right">Rp {{ number_format($trx->purchase_price, 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($subtotal, 0, ',', '.') }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="9" class="no-data">Tidak ada data pembelian</td>
            </tr>
        @endforelse
    </tbody>

    <tfoot>
        <tr>
            <td colspan="6"><strong>Grand Total</strong></td>
            <td colspan="3" class="text-right">
                <strong>Rp {{ number_format($total, 0, ',', '.') }}</strong>
            </td>
        </tr>
    </tfoot>
</table>

</body>
</html>
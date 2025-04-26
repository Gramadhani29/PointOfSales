<?php

namespace App\Http\Controllers;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\Http;

use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $items = $request->input('items');
        $total = 0;
        $orderItems = [];
    
        foreach ($items as $item) {
            $productResponse = Http::get("http://localhost:8001/api/product/{$item['product_id']}");
            $product = $productResponse->json();
    
            if (!$product || $productResponse->failed()) {
                return response()->json(['error' => 'Produk tidak ditemukan'], 404);
            }
    
            $subtotal = $product['product_price'] * $item['quantity'];
            $total += $subtotal;
    
            $orderItems[] = [
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'price' => $product['product_price'],
            ];
        }
    
        $order = Order::create([
            'customer_name' => $request->input('customer_name'),
            'total_price' => $total,
        ]);
    
        foreach ($orderItems as $item) {
            $item['order_id'] = $order->id;
            OrderItem::create($item);
        }
    
        return response()->json([
            'order_id' => $order->id,
            'customer_name' => $order->customer_name,
            'total_price' => $order->total_price,
            'items' => $order->items
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $order = Order::with('items')->find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }
    
        return response()->json($order);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }
    
        $order->customer_name = $request->input('customer_name');
        $order->items()->delete(); // Hapus semua item lama
    
        $total = 0;
        $orderItems = [];
    
        foreach ($request->input('items') as $item) {
            $productResponse = Http::get("http://localhost:8001/api/product/{$item['product_id']}");
            $product = $productResponse->json();
    
            if (!$product || !$productResponse->successful()) {
                return response()->json(['error' => 'Produk tidak ditemukan'], 404);
            }
    
            $subtotal = $product['product_price'] * $item['quantity'];
            $total += $subtotal;
    
            $orderItems[] = new OrderItem([
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'price' => $product['product_price'],
            ]);
        }
    
        $order->total_price = $total;
        $order->save();
        $order->items()->saveMany($orderItems);
    
        return response()->json(['message' => 'Pesanan berhasil diperbarui', 'order' => $order->load('items')]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }
    
        $order->delete();
    
        return response()->json(['message' => 'Pesanan berhasil dihapus']);
    }
}

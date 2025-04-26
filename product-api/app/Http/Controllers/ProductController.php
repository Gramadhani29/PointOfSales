<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Product::all();
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $fields = $request->validate([
            'product_name' => 'required|string|max:255',
            'product_category' => 'required|string|max:255',
            'product_price' => 'required|integer',
            'product_image' => 'required|string|max:255',
        ]);

        $post = Product::create($fields);

        return response()->json([
            'message' => 'Product added successfully',
            'data' => $post
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
            'message' => 'Product not found'
            ], 404);
        }
        return response()->json($product, 200);
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
    public function update(Request $request, Product $product)
    {
        $fields = $request->validate([
            'product_name' => 'sometimes|required|string|max:255',
            'product_category' => 'sometimes|required|string|max:255',
            'product_price' => 'sometimes|required|integer',
            'product_image' => 'sometimes|required|string|max:255',
        ]);

        $product->update($fields);

        return response()->json([
            'message' => 'Product updated successfully',
            'data' => $product
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
            'message' => 'Product not found'
            ], 404);
        }

        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully'
        ], 200);
    }
}

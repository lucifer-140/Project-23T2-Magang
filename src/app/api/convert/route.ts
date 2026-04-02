import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang diunggah" }, { status: 400 });
    }

    // Buat FormData baru yang ditujukan untuk Gotenberg Backend
    const convertData = new FormData();
    convertData.append("files", file);

    // Call Gotenberg container on port 3001
    const gotenbergRes = await fetch("http://localhost:3001/forms/libreoffice/convert", {
      method: "POST",
      body: convertData as unknown as BodyInit,
      // Gotenberg bisa gagal memproses jika batas timeout diabaikan,
      // tapi kita gunakan standard fetch config pada environment lokal:
      cache: "no-store", 
    });

    if (!gotenbergRes.ok) {
        const errorText = await gotenbergRes.text();
        console.error("Gotenberg Engine Error:", errorText);
        return NextResponse.json({ error: `Konversi Gagal Error Code: ${gotenbergRes.status}` }, { status: 500 });
    }

    // Pipe response dari Gotenberg (PDF raw binary buffer) kembali ke client browser
    const pdfBuffer = await gotenbergRes.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${file.name.replace(/\.[^/.]+$/, "")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Kesalahan API Convert Route:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server" }, { status: 500 });
  }
}

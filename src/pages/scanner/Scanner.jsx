import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { io } from "socket.io-client";

const Scanner = () => {

  const { sessionId } = useParams();

  const scannerRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {

    const socket = io(
      import.meta.env.VITE_API_BASE_URL
    );

    socketRef.current = socket;

    socket.on("connect", () => {

      socket.emit(
        "join-scanner-session",
        sessionId
      );

    });

    const scanner = new Html5Qrcode(
      "reader"
    );

    scannerRef.current = scanner;

    scanner.start(
      {
        facingMode: "environment",
      },
      {
        fps: 10,
        qrbox: {
          width: 150,
          height: 150,
        },
      },
      (decodedText) => {

        console.log(
          "SCANNED:",
          decodedText
        );

        socket.emit(
          "barcode-scanned",
          {
            sessionId,
            code: decodedText,
          }
        );

      },
      (errorMessage) => {
        // تجاهل أخطاء البحث العادية
      }
    );

    return () => {

      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {});
      }

      socket.disconnect();

    };

  }, [sessionId]);

  return (
    <div
      className="min-h-screen bg-gray-100 flex items-center justify-center p-4"
      dir="rtl"
    >

      <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-md">

        <h1 className="text-xl font-black text-center mb-2">
          ماسح المنتجات
        </h1>

        <p className="text-center text-gray-500 mb-5">
          وجه الكاميرا إلى QR أو Barcode
        </p>

        <div
          id="reader"
          className="overflow-hidden rounded-xl"
        />

        <div className="mt-5 text-center text-green-600 font-bold">
          🟢 متصل بالسيستم
        </div>

      </div>

    </div>
  );
};

export default Scanner;
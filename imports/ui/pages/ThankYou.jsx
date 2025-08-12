import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

const ThankYou = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-slate-900 to-slate-800 text-white text-center">
            <h1 className="text-4xl font-bold mb-4">🎉 Thank you for checking in!</h1>
            <p className="text-lg text-slate-300 mb-6">Your check-in was successful. Please wait to be greeted.</p>

            {/* Optional QR Code */}
            <QRCodeSVG value="https://yourdomain.com/checked-in" size={150} />
            <p className="mt-2 text-sm text-slate-400">Scan to download your contact card or check-in record</p>

            <button
                onClick={() => navigate('/')}
                className="mt-8 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg transition"
            >
                Return to Home
            </button>
        </div>
    );
};

export default ThankYou;

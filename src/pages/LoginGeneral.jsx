import { useState } from "react";
import { Button, Input } from "@nextui-org/react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

import { useNavigate } from "react-router-dom";
import "./pages.css";
import api from "../utils/api";
import { Bars } from "react-loader-spinner";
import api3 from "../utils/api3";
import api6 from "../utils/api6";

const TopEllipse = () => {
  return (
    <div className="absolute z-0 flex items-center justify-center top-[calc(50%-260px)] md:top-[5%] md:transform md:-translate-x-[224px] md:translate-y-[110%] 2xl:translate-y-[75%]">
      <div className="size-[100px] rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md transition-colors"></div>
    </div>
  );
};

const BottomEllipse = () => {
  return (
    <div className="absolute z-0 flex items-center justify-center bottom-[calc(50%-260px)] md:bottom-[5%] md:transform md:translate-x-[224px] md:-translate-y-[110%] 2xl:-translate-y-[75%]">
      <div className="size-[100px] rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md transition-colors"></div>
    </div>
  );
};

const LoginGeneral = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordType, setPasswordType] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setPasswordType(passwordType === "password" ? "text" : "password");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username && !password) {
      setError("Username dan password tidak boleh kosong");
      setLoading(false);
      return;
    } else if (!username) {
      setError("Username tidak boleh kosong");
      setLoading(false);
      return;
    } else if (!password) {
      setError("Password tidak boleh kosong");
      setLoading(false);
      return;
    }

    try {
      const response = await api6.post("/api/auth/login", {
        username,
        password,
      });

      if (response.status === 200) {
        // Handle successful login
        const returnedUser = response.data.user.username;
        const returnedToken = response.data.token;
        
        localStorage.setItem("username", returnedUser);
        
        let destination = "/";
        if (returnedUser === "admin_pusat") {
          localStorage.setItem("token-pusat", returnedToken);
          destination = "/admin/pusat";
        } else if (returnedUser.startsWith("admin_")) {
          const desaName = returnedUser.replace("admin_", "");
          localStorage.setItem(`token-${desaName}`, returnedToken);
          localStorage.setItem("token-desa-cantik", returnedToken); // IMPORTANT FOR PROTECTED ROUTE
          destination = `/admin/desa/${desaName.toUpperCase()}`;
        } else {
          localStorage.setItem("token-desa-cantik", returnedToken);
          destination = "/admin/desa/SIDOKEPUNG"; // fallback
        }

        setLoading(false);
        navigate(destination);
      }
    } catch (error) {
      if (error.response) {
        // Server responded with a status other than 200 range
        setError(error.response.data.message);
      } else {
        // Network error or other errors
        setError("Login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-50">
      <TopEllipse />
      <BottomEllipse />
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm p-8 m-5 bg-white shadow-2xl rounded-2xl border border-gray-100 md:max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/pict/logo_dc.png"
            alt="Logo"
            className="w-20 h-20 mb-3 md:w-30 md:h-30"
          />
          <p className="text-lg font-bold font-inter text-[#1f2937] md:text-xl mt-3">
            ADMIN PETA TEMATIK
          </p>
        </div>
        <form
          onSubmit={handleLogin}
          className="flex flex-col w-full font-inter form-login"
        >
          <Input
            label="Username"
            placeholder="Masukkan username anda"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            classNames={{
              label: "text-[#1f2937] md:text-lg mt-[5px] font-inter font-semibold",
              inputWrapper: "bg-slate-100",
            }}
            className="my-2"
          />
          <div className="relative">
            <Input
              label="Password"
              placeholder="Masukkan password anda"
              type={passwordType}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              classNames={{
                label:
                  "text-[#1f2937] text-base md:text-lg mt-1 font-inter font-semibold",
                inputWrapper: "bg-slate-100",
              }}
              className="my-2"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute transform -translate-y-1/2 right-2 top-10"
            >
              {passwordType === "password" ? (
                <AiFillEye className="text-[#1f2937]" />
              ) : (
                <AiFillEyeInvisible className="text-[#1f2937]" />
              )}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-[14px] ml-[15px]">{error}</p>
          )}
          <div className="flex justify-center">
            <Button
              type="submit"
              className="w-full my-2 font-bold text-white font-nunito bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md transition-colors"
              disabled={loading}
            >
              {loading ? (
                <Bars width="25" height="25" color="#ffffff" />
              ) : (
                "Masuk"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* {loading && (
        <div className="fixed inset-0 bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md transition-colors flex flex-col justify-center items-center z-50 overflow-hidden">
          <Bars
            height="60"
            width="60"
            color="#0B588F"
            ariaLabel="bars-loading"
            wrapperStyle={{}}
            wrapperClass=""
            visible={true}
          />
          <p className="mt-3 font-semibold font-inter text-[#1f2937]">Loading</p>
        </div>
      )} */}
    </div>
  );
};

export default LoginGeneral;

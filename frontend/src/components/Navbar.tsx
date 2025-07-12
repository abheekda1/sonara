import AuthButton from "./AuthButton";

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">Sonara</a>
      </div>
      <div className="flex-none">
        {/* <ul className="menu menu-horizontal px-1"> */}
        <ul className="px-1">
          <li>
            <AuthButton />
          </li>
        </ul>
      </div>
    </div>
  );
}

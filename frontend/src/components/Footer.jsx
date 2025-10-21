const Footer = () => {
  return (
    <footer>
      <div className="bg-gradient-to-r from-[#22292E] to-[#2A4E5D] text-white py-6 font-poppins">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Air Quality Monitor. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

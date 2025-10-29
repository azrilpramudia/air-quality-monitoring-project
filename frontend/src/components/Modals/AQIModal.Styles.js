export const styles = `
  @keyframes modalIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-modal-in {
    animation: modalIn 0.3s ease-out;
  }
`;
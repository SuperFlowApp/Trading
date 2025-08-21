import { useState } from 'react';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { isUsernameTaken } from '../../services/firestore';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [isCreatingNewAccount, setIsCreatingNewAccount] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useUserProfile();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      // When creating new account, check if username exists
      if (isCreatingNewAccount) {
        const taken = await isUsernameTaken(username);
        if (taken) {
          setError('Username already exists. Please choose another one.');
          return;
        }
      }

      await login(username);
    } catch (err) {
      setError('Failed to log in. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-backgroundmid rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-liquidwhite">
        {isCreatingNewAccount ? 'Create Account' : 'Login'}
      </h2>
      
      {error && <div className="mb-4 p-2 bg-red-500/20 text-red-400 rounded">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-liquidwhite">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 bg-backgrounddark border border-primary2darker rounded text-white"
            placeholder="Enter username"
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            className="mr-2 px-4 py-2 bg-backgrounddark rounded text-liquidwhite"
            onClick={() => setIsCreatingNewAccount(!isCreatingNewAccount)}
            disabled={isLoading}
          >
            {isCreatingNewAccount ? 'Back to Login' : 'Create New Account'}
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-primary2dark rounded text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : isCreatingNewAccount ? 'Create' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
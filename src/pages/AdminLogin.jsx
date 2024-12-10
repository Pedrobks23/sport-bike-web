import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Se já estiver autenticado, redireciona para /admin
  React.useEffect(() => {
    if (user) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O useEffect acima cuidará do redirecionamento
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
      
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Usuário desabilitado.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta.';
          break;
        default:
          errorMessage = 'Erro ao fazer login. Tente novamente.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

 return (
   <div className="min-h-screen bg-[#f5f5f5] flex flex-col justify-center items-center px-4">
     <div className="w-full max-w-md">
       <div className="flex justify-center mb-8">
         <img src="/assets/Logo.png" alt="Sport & Bike" className="h-24" />
       </div>

       <div className="bg-white p-8 rounded-lg shadow-md">
         <h1 className="text-2xl font-bold text-center text-[#333] mb-8">
           Área Administrativa
         </h1>

         {error && (
           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
             {error}
           </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-6">
           <div>
             <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
               E-mail
             </label>
             <input
               id="email"
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
               required
             />
           </div>

           <div>
             <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
               Senha
             </label>
             <input
               id="password"
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
               required
             />
           </div>

           <button
             type="submit"
             disabled={loading}
             className="w-full bg-[#FFC107] text-[#333] py-2 px-4 rounded-md hover:bg-[#FFB000] transition-colors font-bold disabled:opacity-50"
           >
             {loading ? 'Entrando...' : 'Entrar'}
           </button>
         </form>

         <div className="mt-6 text-center">
           <button
             onClick={() => navigate('/')}
             className="text-gray-600 hover:text-[#FFC107] transition-colors text-sm"
           >
             Voltar para o site
           </button>
         </div>
       </div>
     </div>
   </div>
 );
};

export default AdminLogin;
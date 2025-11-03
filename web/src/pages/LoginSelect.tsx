import { useNavigate } from 'react-router-dom';

export default function LoginSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">ChoreMint</h1>
          <p className="text-gray-600">가족과 함께하는 할 일 관리</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/parent-login')}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl px-6 py-4 font-medium hover:from-blue-600 hover:to-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            부모로 로그인
          </button>

          <button
            onClick={() => navigate('/child-login')}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-xl px-6 py-4 font-medium hover:from-orange-500 hover:to-pink-500 transition-colors shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            자녀로 로그인
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            💡 부모는 Google 계정으로, 자녀는 PIN으로 로그인합니다
          </p>
        </div>
      </div>
    </div>
  );
}


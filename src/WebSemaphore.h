#include <emscripten.h>
#include <emscripten/wasm_worker.h>
#include <Jolt/Core/Core.h>

#pragma once

using uint = unsigned int;

class WebSemaphore {
public:
	/// Release the semaphore, signalling the thread waiting on the barrier that there may be work
	void	Release(uint inNumber = 1) { emscripten_semaphore_release(&_semaphore, inNumber); }

	/// Acquire the semaphore inNumber times
	void	Acquire(uint inNumber = 1) { emscripten_semaphore_waitinf_acquire(&_semaphore, inNumber); }

	/// Get the current value of the semaphore
	inline emscripten_semaphore_t	GetValue() const{ return _semaphore; }
	void Clear() { _semaphore = 0; } 
private:
		emscripten_semaphore_t _semaphore = 0;
};

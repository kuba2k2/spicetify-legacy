/// <reference types="redux" />
/// <reference types="react-redux" />

declare namespace Spicetify {

	namespace Redux {
		type Provider = import("react-redux").Provider

		function batch(cb: () => void): void;
		const connect: import("react-redux").Connect
	}

	type ReduxStoreType = {
		default: import("redux").Store
	}

	const ReduxStore: ReduxStoreType
}

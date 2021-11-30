declare namespace Spicetify {
	/**
	 * Fetch interesting colors from URI.
	 * @param uri Any type of URI that has artwork (playlist, track, album, artist, show, ...)
	 */
	function colorExtractor(uri: string): Promise<{
		DESATURATED: string
		LIGHT_VIBRANT: string
		PROMINENT: string
		VIBRANT: string
		VIBRANT_NON_ALARMING: string
	}>

	/**
	 * Fetch interesting colors from track album art.
	 * @param uri is optional. Leave it blank to get currrent track
	 * or specify another track uri.
	 */
	function getAblumArtColors(uri?: string): Promise<{
		DESATURATED: string
		LIGHT_VIBRANT: string
		PROMINENT: string
		VIBRANT: string
		VIBRANT_NON_ALARMING: string
	}>

	/**
	 * Fetch track analyzed audio data.
	 * Beware, not all tracks have audio data.
	 * @param uri is optional. Leave it blank to get current track
	 * or specify another track uri.
	 */
	function getAudioData(uri?: string): Promise<any>

	/**
	 * Set of APIs method to register, deregister hotkeys/shortcuts
	 */
	const Keyboard: any

	namespace LocalStorage {
		/**
		 * Empties the list associated with the object of all key/value pairs, if there are any.
		 */
		function clear(): void
		/**
		 * Get key value
		 */
		function get(key: string): string | null
		/**
		 * Delete key
		 */
		function remove(key: string): void
		/**
		 * Set new value for key
		 */
		function set(key: string, value: string): void
	}

	/**
	 * Display a bubble of notification. Useful for a visual feedback.
	 */
	function showNotification(text: string): void

	/**
	 * Popup Modal
	 */
	namespace PopupModal {
		interface Content {
			MODAL_TITLE?: string

			URL?: string
			MESSAGE?: string
			CONTENT?: Element

			AUTOFOCUS_OK_BUTTON?: boolean
			BACKDROP_DONT_COVER_PLAYER?: boolean
			HEIGHT?: number
			PAGE_ID?: string
			HIGH_PRIORITY?: boolean
			MODAL_CLASS?: string

			BUTTONS?: {
				OK?: boolean
				CANCEL?: boolean
			}

			OK_BUTTON_LABEL?: string
			CANCEL_BUTTON_LABEL?: string

			CAN_HIDE_BY_CLICKING_BACKGROUND?: boolean
			CAN_HIDE_BY_PRESSING_ESCAPE?: boolean

			renderReactComponent?: () => React.ReactNode

			onOk?: () => void
			onCancel?: () => void
			onShow?: () => void
			onHide?: () => void
		}

		function display(e: Content): void

		function hide(): void
	}

	type ModalParams = {
		children: React.ReactNode
		title?: string
		className?: string
		isCancelable?: boolean
		okLabel?: string
		cancelLabel?: string
		onOk?: () => void
		onCancel?: () => void
		onShow?: () => void
		onHide?: () => void
	}

	// @ts-ignore
	function showReactModal(data: ModalParams): PopupModal
}

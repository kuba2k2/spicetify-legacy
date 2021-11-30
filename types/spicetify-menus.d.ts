declare namespace Spicetify {
	/**
	 * To create and prepend custom menu item in profile menu.
	 */
	namespace Menu {
		/**
		 * Create a single toggle.
		 */
		class Item {
			constructor(
				name: string,
				isEnabled: boolean,
				onClick: (self: Item) => void
			)
			/**
			 * Change item name
			 */
			setName(name: string): void
			/**
			 * Change item enabled state.
			 * Visually, item would has a tick next to it if its state is enabled.
			 */
			setState(isEnabled: boolean): void
			/**
			 * Item is only available in Profile menu when method "register" is called.
			 */
			register(): void
			/**
			 * Stop item to be prepended into Profile menu.
			 */
			deregister(): void
		}

		/**
		 * Create a sub menu to contain Item toggles.
		 * `Item`s in `subItems` array shouldn't be registered.
		 */
		class SubMenu {
			constructor(name: string, subItems: Item[])
			/**
			 * Change SubMenu name
			 */
			setName(name: string): void
			/**
			 * SubMenu is only available in Profile menu when method "register" is called.
			 */
			register(): void
			/**
			 * Stop SubMenu to be prepended into Profile menu.
			 */
			deregister(): void
		}
	}

	/**
	 * Create custom menu item and prepend to right click context menu
	 */
	namespace ContextMenu {
		// Single context menu item
		class Item {
			/**
			 * List of valid icons to use.
			 */
			static readonly iconList: Spicetify.Model.Icon[]
			constructor(
				name: string,
				onClick: (uris: string[]) => void,
				shouldAdd?: (uris: string[]) => boolean,
				icon?: Spicetify.Model.Icon,
				disabled?: boolean
			)
			set name(text: string)
			set icon(name: Spicetify.Model.Icon)
			set disabled(bool: boolean)
			/**
			 * A function returning boolean determines whether item should be prepended.
			 */
			set shouldAdd(func: (uris: string[]) => boolean)
			/**
			 * A function to call when item is clicked
			 */
			set onClick(func: (uris: string[]) => void)
			/**
			 * Item is only available in Context Menu when method "register" is called.
			 */
			register: () => void
			/**
			 * Stop Item to be prepended into Context Menu.
			 */
			deregister: () => void
		}

		/**
		 * Create a sub menu to contain `Item`s.
		 * `Item`s in `subItems` array shouldn't be registered.
		 */
		class SubMenu {
			/**
			 * List of valid icons to use.
			 */
			static readonly iconList: Spicetify.Model.Icon[]
			constructor(
				name: string,
				subItems: Item[],
				shouldAdd?: (uris: string[]) => boolean,
				icon?: Spicetify.Model.Icon,
				disabled?: boolean
			)
			set name(text: string)
			set icon(name: Spicetify.Model.Icon)
			set disabled(bool: boolean)
			/**
			 * Replace current `Item`s list
			 */
			set items(items: Item[])
			addItem: (item: Item) => void
			removeItem: (item: Item) => void
			/**
			 * A function returning boolean determines whether item should be prepended.
			 */
			set shouldAdd(func: (uris: string[]) => boolean)
			/**
			 * SubMenu is only available in Context Menu when method "register" is called.
			 */
			register: () => void
			/**
			 * Stop SubMenu to be prepended into Context Menu.
			 */
			deregister: () => void
		}
	}
}

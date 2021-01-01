function painterSortStable( a, b ) {

	if ( a.groupOrder !== b.groupOrder ) {

		return a.groupOrder - b.groupOrder;

	} else if ( a.renderOrder !== b.renderOrder ) {

		return a.renderOrder - b.renderOrder;

	} else if ( a.program !== b.program ) {

		return a.program.id - b.program.id;

	} else if ( a.material.id !== b.material.id ) {

		return a.material.id - b.material.id;

	} else if ( a.z !== b.z ) {

		return a.z - b.z;

	} else {

		return a.id - b.id;

	}

}

function reversePainterSortStable( a, b ) {

	if ( a.groupOrder !== b.groupOrder ) {

		return a.groupOrder - b.groupOrder;

	} else if ( a.renderOrder !== b.renderOrder ) {

		return a.renderOrder - b.renderOrder;

	} else if ( a.z !== b.z ) {

		return b.z - a.z;

	} else {

		return a.id - b.id;

	}

}


class WebGLRenderList{

	constructor( properties ) {

		this.properties = properties;

		const renderItems = [];
		this.renderItems = renderItems;


		let renderItemsIndex = 0;
		this.renderItemsIndex = renderItemsIndex;

		const opaque = [];
		this.opaque = opaque;

		const transparent = [];
		this.transparent = transparent;


		const defaultProgram = { id: - 1 };
		this.defaultProgram = defaultProgram;

	}

	init() {

		this.renderItemsIndex = 0;

		this.opaque.length = 0;
		this.transparent.length = 0;

	}

	getNextRenderItem( object, geometry, material, groupOrder, z, group ) {

		let renderItem = this.renderItems[ this.renderItemsIndex ];
		const materialProperties = this.properties.get( material );

		if ( renderItem === undefined ) {

			renderItem = {
				id: object.id,
				object: object,
				geometry: geometry,
				material: material,
				program: materialProperties.program || this.defaultProgram,
				groupOrder: groupOrder,
				renderOrder: object.renderOrder,
				z: z,
				group: group
			};

			this.renderItems[ this.renderItemsIndex ] = renderItem;

		} else {

			renderItem.id = object.id;
			renderItem.object = object;
			renderItem.geometry = geometry;
			renderItem.material = material;
			renderItem.program = materialProperties.program || this.defaultProgram;
			renderItem.groupOrder = groupOrder;
			renderItem.renderOrder = object.renderOrder;
			renderItem.z = z;
			renderItem.group = group;

		}

		this.renderItemsIndex ++;

		return renderItem;

	}

	push( object, geometry, material, groupOrder, z, group ) {

		const renderItem = this.getNextRenderItem( object, geometry, material, groupOrder, z, group );

		( material.transparent === true ? this.transparent : this.opaque ).push( renderItem );

	}

	unshift( object, geometry, material, groupOrder, z, group ) {

		const renderItem = this.getNextRenderItem( object, geometry, material, groupOrder, z, group );

		( material.transparent === true ? this.transparent : this.opaque ).unshift( renderItem );

	}

	sort( customOpaqueSort, customTransparentSort ) {

		if ( this.opaque.length > 1 ) this.opaque.sort( customOpaqueSort || painterSortStable );
		if ( this.transparent.length > 1 ) this.transparent.sort( customTransparentSort || reversePainterSortStable );

	}

	finish() {

		// Clear references from inactive renderItems in the list

		for ( let i = this.renderItemsIndex, il = this.renderItems.length; i < il; i ++ ) {

			const renderItem = this.renderItems[ i ];

			if ( renderItem.id === null ) break;

			renderItem.id = null;
			renderItem.object = null;
			renderItem.geometry = null;
			renderItem.material = null;
			renderItem.program = null;
			renderItem.group = null;

		}

	}

}

class WebGLRenderLists {

	constructor( properties ) {

		this.properties = properties;
		this.lists = new WeakMap();

	}

	get( scene, camera ) {

		const cameras = this.lists.get( scene );
		let list;

		if ( cameras === undefined ) {

			list = new WebGLRenderList( this.properties );
			this.lists.set( scene, new WeakMap() );
			this.lists.get( scene ).set( camera, list );

		} else {

			list = cameras.get( camera );
			if ( list === undefined ) {

				list = new WebGLRenderList( this.properties );
				cameras.set( camera, list );

			}

		}

		return list;

	}

	dispose() {

		this.lists = new WeakMap();

	}

}


export { WebGLRenderLists, WebGLRenderList };

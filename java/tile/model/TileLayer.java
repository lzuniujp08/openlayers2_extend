package com.lzugis.tile.model;

import java.util.HashMap;

public class TileLayer {
	private String layername = null;
	
	private int minZoom = 0;
	
	private int maxZoom = 0;
	
	private int maxTileCount = 20000;
	
	private String startDate = "";
	
	private String endDate = "";
	
	private HashMap<Integer,TileLevel> tileLevels = new HashMap<Integer,TileLevel>();

	public String getLayername() {
		return layername;
	}

	public void setLayername(String layername) {
		this.layername = layername;
	}

	public int getMinZoom() {
		return minZoom;
	}

	public void setMinZoom(int minZoom) {
		this.minZoom = minZoom;
	}

	public int getMaxZoom() {
		return maxZoom;
	}

	public void setMaxZoom(int maxZoom) {
		this.maxZoom = maxZoom;
	}

	public int getMaxTileCount() {
		return maxTileCount;
	}

	public void setMaxTileCount(int maxTileCount) {
		this.maxTileCount = maxTileCount;
	}

	public int getTileTotalCount() {
		int tileTotalCount= 0;
		int minZoom = this.getMinZoom();
		int maxZoom = this.getMaxZoom();
		for (int i = minZoom; i <= maxZoom; i++) {
			TileLevel tileLevel = this.getTileLevel(i);
			tileTotalCount += tileLevel.getTileCount();
		}
		return tileTotalCount;
	}

	public String getStartDate() {
		return startDate;
	}

	public void setStartDate(String startDate) {
		this.startDate = startDate;
	}

	public String getEndDate() {
		return endDate;
	}

	public void setEndDate(String endDate) {
		this.endDate = endDate;
	}

	public void addTileLevel(TileLevel tileLevel) {
		tileLevels.put(tileLevel.getLevelname(), tileLevel);
	}
	
	public TileLevel getTileLevel(int levelname){
		return tileLevels.get(levelname);
	}
	
	public int getMinRow(int zoom){
		TileLevel tileLevel = tileLevels.get(zoom);
		return tileLevel.getMinrow();
	}
	
	public int getMaxRow(int zoom){
		TileLevel tileLevel = tileLevels.get(zoom);
		return tileLevel.getMaxrow();
	}
	
	public int getMinColumn(int zoom){
		TileLevel tileLevel = tileLevels.get(zoom);
		return tileLevel.getMincolumn();
	}
	
	public int getMaxColumn(int zoom){
		TileLevel tileLevel = tileLevels.get(zoom);
		return tileLevel.getMaxcolumn();
	}

}
